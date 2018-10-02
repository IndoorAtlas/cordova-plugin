
var utils = require('cordova/utils'),
    exec = require('cordova/exec')

var timers = {};   // list of timers in use

function getDeviceType() {
  var deviceType = (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" :
                   (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" :
                   (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" :
                   (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
  return deviceType;
}

function parseSetPositionParameters(options) {
  var opt = {
    regionId: '',
    coordinates: [],
    floorPlanId: '',
    venueId: ''
  };
  if (options) {
    if (options.venueId !== undefined) {
      opt.venueId = options.venueId;
    }

    if (options.regionId !== undefined) {
      opt.regionId = options.regionId;
    }

    if (options.coordinates !== undefined) {
      opt.coordinates = options.coordinates;
    }

    if (options.floorPlanId !== undefined) {
      opt.floorPlanId = options.floorPlanId;
    }

  }
  return opt;
}

function parseParameters(options) {
  var opt = {
    timeout: Infinity
  };

  if (options) {
    if (options.timeout !== undefined && !isNaN(options.timeout)) {
      if (options.timeout < 0) {
        opt.timeout = 0;
      } else {
        opt.timeout = options.timeout;
      }
    }
  }
  return opt;
}

function createTimeout(errorCallback, timeout) {
  var t = setTimeout(function() {
    clearTimeout(t);
    t = null;
    errorCallback({
      code: PositionError.TIMEOUT,
      message: "Position retrieval timed out."
    });
  }, timeout);
  return t;
}

function buildIaErrorCallback(errorCallback) {
  return function(error) {
    var err = new PositionError(error.code, error.message);
    errorCallback(err);
  };
}

var IndoorAtlas = {
  lastPosition: null, // reference to last known (cached) position returned
  initializeAndroid: function(successCallback, errorCallback, options) {
    var fail = buildIaErrorCallback(errorCallback);
    var requestWin = function(result) {
      var win = successCallback;
      exec(win, fail, "IndoorAtlas", "initializeIndoorAtlas", [options.key, options.secret]);
    };
    exec(requestWin, fail, "IndoorAtlas", "getPermissions", []);
  },

  initialize: function(successCallback, errorCallback, options) {
    if (getDeviceType() == 'Android') {
      IndoorAtlas.initializeAndroid(successCallback, errorCallback, options);
      return;
    }
    var win = successCallback;
    var fail = buildIaErrorCallback(errorCallback);
    exec(win, fail, "IndoorAtlas", "initializeIndoorAtlas", [options]);
  },

  getCurrentPosition: function(successCallback, errorCallback, options) {
    try {
      options = parseParameters(options);

      // Timer var that will fire an error callback if no position is retrieved from native
      // before the "timeout" param provided expires
      var timeoutTimer = { timer: null };
      var win = function(p) {
        try {
          clearTimeout(timeoutTimer.timer);
          if (!(timeoutTimer.timer)) {
            // Timeout already happened, or native fired error callback for
            // this geo request.
            // Don't continue with success callback.
            return;
          }
          var pos = new Position(
            {
              latitude: p.latitude,
              longitude: p.longitude,
              altitude: p.altitude,
              accuracy: p.accuracy,
              heading: p.heading,
              velocity: p.velocity,
              flr: p.flr
            },
            p.region,
            p.timestamp,
            p.floorCertainty
          );
          IndoorAtlas.lastPosition = pos;
          successCallback(pos);
        }
        catch(error) {
          alert(error);
        }
      };

      var fail = function(e) {
        clearTimeout(timeoutTimer.timer);
        timeoutTimer.timer = null;
        var err = new PositionError(e.code, e.message);
        if (errorCallback) {
          errorCallback(err);
        }
      };

      // Check our cached position, if its timestamp difference with current time is less than the maximumAge, then just
      // fire the success callback with the cached position.
      if (IndoorAtlas.lastPosition && options.maximumAge && (((new Date()).getTime() - IndoorAtlas.lastPosition.timestamp) <= options.maximumAge)) {
        successCallback(IndoorAtlas.lastPosition);

        // If the cached position check failed and the timeout was set to 0, error out with a TIMEOUT error object.
      } else if (options.timeout === 0) {
        fail({
          code: PositionError.TIMEOUT,
          message: "timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
        });

        // Otherwise we have to call into native to retrieve a position.
      } else {
        if (options.timeout !== Infinity) {
          // If the timeout value was not set to Infinity (default), then
          // set up a timeout function that will fire the error callback
          // if no successful position was retrieved before timeout expired.
          timeoutTimer.timer = createTimeout(fail, options.timeout);
        } else {
          // This is here so the check in the win function doesn't mess stuff up
          // may seem weird but this guarantees timeoutTimer is
          // always truthy before we call into native
          timeoutTimer.timer = true;
        }
        exec(win, fail, "IndoorAtlas", "getLocation", [options.floorPlan]);
      }
      return timeoutTimer;
    }
    catch(error) { alert(error); }
  },

  watchRegion: function(onEnterRegion, onExitRegion, errorCallback) {
    var id = utils.createUUID();

    var fail = buildIaErrorCallback(errorCallback);
    var win = function(r) {

      function iaFloorPlanFromObject(fp) {
        return new FloorPlan(
          fp.id,
          fp.name,
          fp.url,
          fp.floorLevel,
          fp.bearing,
          fp.bitmapHeight,
          fp.bitmapWidth,
          fp.heightMeters,
          fp.widthMeters,
          fp.metersToPixels,
          fp.pixelsToMeters,
          fp.bottomLeft,
          fp.center,
          fp.topLeft,
          fp.topRight
        );
      }

      var floorPlan = null, venue = null;
      if (r.floorPlan) {
        floorPlan = iaFloorPlanFromObject(r.floorPlan);
      }
      if (r.venue) {
        venue = r.venue;
        venue.floorPlans = venue.floorPlans.map(iaFloorPlanFromObject);
      }

      var region = new Region(r.regionId, r.timestamp, r.regionType, r.transitionType, floorPlan, venue);
      if (region.transitionType == Region.TRANSITION_TYPE_ENTER) {
        onEnterRegion(region);
      }
      if (region.transitionType == Region.TRANSITION_TYPE_EXIT) {
        onExitRegion(region);
      }
    };

    exec(win, fail, "IndoorAtlas", "addRegionWatch", [id]);
    return id;
  },

  clearRegionWatch: function(watchId) {
    try {
      exec(
        function(success) {
          console.log('Service stopped');
        },
        function(error) {
          console.log('Error while stopping service');
        },
        "IndoorAtlas", "clearRegionWatch", [watchId]);
    }
    catch(error) { alert(error); }
  },

  didUpdateAttitude: function(onAttitudeUpdated, errorCallback) {
    var fail = buildIaErrorCallback(errorCallback);
    var win = onAttitudeUpdated;
    exec(win, fail, "IndoorAtlas", "addAttitudeCallback");
  },

  removeAttitudeCallback: function() {
    var fail = function(e) {
      console.log("Error while removing attitude callback");
    };

    var win = function(success) {};
    exec(win, fail, "IndoorAtlas", "removeAttitudeCallback");
  },

  didUpdateHeading: function(onHeadingUpdated, errorCallback) {
    var fail = buildIaErrorCallback(errorCallback);
    var win = onHeadingUpdated;
    exec(win, fail, "IndoorAtlas", "addHeadingCallback");
  },

  removeHeadingCallback: function() {
    var fail = function(e) {
      console.log("Error while removing heading callback");
    };

    var win = function(success) {};
    exec(win, fail, "IndoorAtlas", "removeHeadingCallback");
  },

  onStatusChanged: function(onStatusChanged, errorCallback) {
    var fail = buildIaErrorCallback(errorCallback);

    var win = function(status) {
      var newStatus = new CurrentStatus(status.code, status.message);
      onStatusChanged(newStatus);
    };

    exec(win, fail, "IndoorAtlas", "addStatusChangedCallback");
  },

  removeStatusCallback: function() {
    var fail = function(e) {
      console.log("Error while removing status callback");
    };

    var win = function(success) {};
    exec(win, fail, "IndoorAtlas", "removeStatusCallback");
  },

  watchPosition: function(successCallback, errorCallback, options) {
    options = parseParameters(options);

    var id = utils.createUUID();

    // Tell device to get a position ASAP, and also retrieve a reference to the timeout timer generated in getCurrentPosition
    timers[id] = IndoorAtlas.getCurrentPosition(successCallback, errorCallback, options);

    var fail = function(e) {
      clearTimeout(timers[id].timer);
      var err = new PositionError(e.code, e.message);
      if (errorCallback) {
        errorCallback(err);
      }
    };

    var win = function(p) {
      clearTimeout(timers[id].timer);
      if (options.timeout !== Infinity) {
        timers[id].timer = createTimeout(fail, options.timeout);
      }
      var pos = new Position(
        {
          latitude: p.latitude,
          longitude: p.longitude,
          altitude: p.altitude,
          accuracy: p.accuracy,
          heading: p.heading,
          velocity: p.velocity,
          flr: p.flr
        },
        p.region,
        p.timestamp,
        p.floorCertainty
      );
      IndoorAtlas.lastPosition = pos;
      successCallback(pos);
    };
    exec(win, fail, "IndoorAtlas", "addWatch", [id, options.floorPlan]);
    return id;
  },

  clearWatch: function(watchId) {
    try {
      exec(
        function(success) {
          console.log('Service stopped');
        },
        function(error) {
          console.log('Error while stopping service');
        },
        "IndoorAtlas", "clearWatch", [watchId]);
    }
    catch(error) { alert(error); };
  },

  setPosition: function(successCallback, errorCallback, options) {
    var keys = Object.keys(options);
    options = parseSetPositionParameters(options);

    var win = successCallback;
    var fail = buildIaErrorCallback(errorCallback);

    if ((options.coordinates.length == 2 && keys.length == 2) || keys.length == 1) {

      exec(win, fail, "IndoorAtlas", "setPosition",
      [options.regionId, options.coordinates, options.floorPlanId, options.venueId]);
    } else {
      console.log("IndoorAtlas: SetPosition: Check values");
    };
  },

  requestWayfindingUpdates: function(destination, onWayfindingUpdate, errorCallback) {
    var fail = buildIaErrorCallback(errorCallback);
    var win = onWayfindingUpdate;
    exec(win, fail, "IndoorAtlas", "requestWayfindingUpdates", [destination.latitude, destination.longitude, destination.floor]);
  },

  removeWayfindingUpdates: function () {
    // never called on Android
    var win = function (success) {};
    var fail = buildIaErrorCallback(null);
    exec(win, fail, "IndoorAtlas", "removeWayfindingUpdates", []);
  },

  lockFloor: function (floorNumber) {
    var win = function (success) {};
    var fail = buildIaErrorCallback(null);

    function iaIsInteger(value) {
      // official Mozilla polyfill for Number.isInteger
      return typeof value === 'number' &&  isFinite(value) && Math.floor(value) === value;
    }

    if (iaIsInteger(floorNumber)) {
      exec(win, fail, "IndoorAtlas", "lockFloor", [floorNumber]);
    } else {
      // should use console.error, exception etc., but doing this for
      // consistency with other methods
      console.log("lockFloor(floorNumber) error: floorNumber must be an integer");
    }
  },

  unlockFloor: function () {
    var win = function (success) {};
    var fail = buildIaErrorCallback(null);
    exec(win, fail, "IndoorAtlas", "unlockFloor", []);
  },

  lockIndoors: function (locked) {
    // notice that since all parameters are optional in JavaScript, we cannot
    // avoid users calling .lockIndoors(). This is interpreted as enabling
    // IndoorLock (instead of .lockIndoors(false)) to avoid confusion.
    var isLocked = !!locked || locked === undefined;
    var win = function (success) {};
    var fail = buildIaErrorCallback(null);
    exec(win, fail, "IndoorAtlas", "lockIndoors", [isLocked]);
  },

  setDistanceFilter: function(successCallback, errorCallback, distance) {
    var win = successCallback;
    var fail = buildIaErrorCallback(errorCallback);
    exec(win, fail, "IndoorAtlas", "setDistanceFilter", [distance.distance]);
  },

  setSensitivities: function(successCallback, errorCallback, sensitivity) {
    var win = successCallback;
    var fail = buildIaErrorCallback(errorCallback);
    exec(win, fail, "IndoorAtlas", "setSensitivities", [sensitivity.orientationSensitivity, sensitivity.headingSensitivity]);
  },

  getFloorCertainty: function(successCallback, errorCallback) {
    var win = successCallback;
    var fail = buildIaErrorCallback(errorCallback);
    exec(win, fail, "IndoorAtlas", "getFloorCertainty");
  },

  getTraceId: function(successCallback, errorCallback) {
    var win = successCallback;
    var fail = buildIaErrorCallback(errorCallback);
    exec(win, fail, "IndoorAtlas", "getTraceId");
  }
};

module.exports = IndoorAtlas;
