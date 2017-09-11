
var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec')

var timers = {};   // list of timers in use

function getDeviceType(){
    var deviceType = (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" :
                     (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" :
                     (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" :
                     (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" :
                     "null";
    return deviceType;
}

function parseSetPositionParameters(options) {
    var opt = {
        regionId : '',
        coordinates : []
    };
    if (options) {
        if (options.regionId !== undefined) {
            opt.regionId = options.regionId;
        }
        if (options.coordinates !== undefined) {
            opt.coordinates = options.coordinates;
        }
    }
    return opt;
}

function parseParameters(options) {
    var opt = {
        timeout : Infinity
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
            code : PositionError.TIMEOUT,
            message : "Position retrieval timed out."
        });
    }, timeout);
    return t;
}

var IndoorAtlas = {
    lastPosition : null, // reference to last known (cached) position returned
    initializeAndroid: function(successCallback, errorCallback, options) {
        var requestWin = function(result) {
                var win = function(result) {
                    successCallback(result);
                };
                var fail = function(error) {
                    var err = new PositionError(error.code, error.message);
                    errorCallback(err);
                };
                exec(win, fail, "IndoorAtlas", "initializeIndoorAtlas",
                     [options.key, options.secret]);
        };
        var requestFail = function(error) {
            var err = new PositionError(error.code, error.message);
            errorCallback(err);
        };
        exec(requestWin, requestFail, "IndoorAtlas", "getPermissions", []);
    },

    initialize: function(successCallback, errorCallback, options) {
        if (getDeviceType() == 'Android') {
            IndoorAtlas.initializeAndroid(successCallback, errorCallback, options);
	        return;
        }
        var win = function(p) {
            successCallback(p);
        };
        var fail = function(e) {
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };
        exec(win, fail, "IndoorAtlas", "initializeIndoorAtlas", [options]);
    },

    getCurrentPosition: function(successCallback, errorCallback, options) {
        try {
            options = parseParameters(options);

            // Timer var that will fire an error callback if no position is retrieved from native
            // before the "timeout" param provided expires
            var timeoutTimer = {timer : null};
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
                            latitude : p.latitude,
                            longitude : p.longitude,
                            altitude : p.altitude,
                            accuracy : p.accuracy,
                            heading : p.heading,
                            velocity : p.velocity,
                            flr : p.flr
                        },
                        p.region,
                        p.timestamp
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
            if (IndoorAtlas.lastPosition && options.maximumAge
              && (((new Date()).getTime() - IndoorAtlas.lastPosition.timestamp) <= options.maximumAge)) {

                successCallback(IndoorAtlas.lastPosition);
            // If the cached position check failed and the timeout was set to 0, error out with a TIMEOUT error object.
            } else if (options.timeout === 0) {
                fail({
                    code : PositionError.TIMEOUT,
                    message : "timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
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
        catch(error) {alert(error);}
    },

    watchRegion: function(onEnterRegion, onExitRegion, errorCallback) {
        var id = utils.createUUID();

        var fail = function(e) {
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };

        var win = function(r) {
            var region = new Region(r.regionId, r.timestamp, r.regionType, r.transitionType);
            if (region.transitionType == Region.TRANSITION_TYPE_ENTER){
                onEnterRegion(region);
            }
            if (region.transitionType == Region.TRANSITION_TYPE_EXIT){
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
                    "IndoorAtlas","clearRegionWatch",[watchId]);
        }
        catch(error) {alert(error);}
    },

    didUpdateAttitude: function(onAttitudeUpdated, errorCallback) {
              var fail = function(e) {
                  if (errorCallback) {
                      errorCallback(e);
                  }
              };

              var win = function(attitude) {
                onAttitudeUpdated(attitude);
              };

              exec(win, fail, "IndoorAtlas", "addAttitudeCallback");
    },

    removeAttitudeCallback: function() {
      var fail = function(e) {
        console.log("Error while removing attitude callbackk");
      };

      var win = function(success) {
        console.log("Attitude callback removed");
      };

      exec(win, fail, "IndoorAtlas", "removeAttitudeCallback");
    },

    didUpdateHeading: function(onHeadingUpdated, errorCallback) {
      var fail = function(e) {
          if (errorCallback) {
              errorCallback(e);
          }
      };

      var win = function(heading) {
        onHeadingUpdated(heading);
      };

      exec(win, fail, "IndoorAtlas", "addHeadingCallback");
    },

    removeHeadingCallback: function() {
      var fail = function(e) {
        console.log("Error while removing heading callback");
      };

      var win = function(success) {
        console.log("Heading callback removed");
      };

      exec(win, fail, "IndoorAtlas", "removeHeadingCallback");
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
                    latitude : p.latitude,
                    longitude : p.longitude,
                    altitude : p.altitude,
                    accuracy : p.accuracy,
                    heading : p.heading,
                    velocity : p.velocity,
                    flr : p.flr
                },
                p.region,
                p.timestamp
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
                "IndoorAtlas","clearWatch",[watchId]);
        }
        catch(error) {alert(error);}
    },

    setPosition: function(successCallback, errorCallback, options) {
        options = parseSetPositionParameters(options);
        var win = function(p) {
            successCallback(p);
        };
        var fail = function(e) {
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };
        exec(win, fail, "IndoorAtlas", "setPosition",
             [options.regionId,options.coordinates]);
    },

    fetchFloorPlanWithId: function(floorplanId, successCallback, errorCallback){
        var win = function(p) {
            var floorplan = new FloorPlan(
                p.id,
                p.name,
                p.url,
                p.floorLevel,
                p.bearing,
                p.bitmapHeight,
                p.bitmapWidth,
                p.heightMeters,
                p.widthMeters,
                p.metersToPixels,
                p.pixelsToMeters,
                p.bottomLeft,
                p.center,
                p.topLeft,
                p.topRight
            );
            successCallback(floorplan);
        };
        var fail = function(e) {
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };
        exec(win, fail, "IndoorAtlas", "fetchFloorplan", [floorplanId]);
    },

    coordinateToPoint: function(coords, floorplanId, successCallback, errorCallback){
        var win = function(p) {
            successCallback(p);
        };
        var fail = function(e) {
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };
        exec(win, fail, "IndoorAtlas", "coordinateToPoint",
             [coords.latitude, coords.longitude, floorplanId]);
    },

    pointToCoordinate: function(point, floorplanId, successCallback, errorCallback) {
        var win = function(p) {
            successCallback(p);
        };
        var fail = function(e) {
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };
        exec(win, fail, "IndoorAtlas", "pointToCoordinate",
             [point.x, point.y, floorplanId]);
    },

    setDistanceFilter: function(successCallback, errorCallback, distance) {
        var win = function(p) {
            successCallback(p);
        };
        var fail = function(e) {
            if (errorCallback) {
                errorCallback(e);
            }
        };
        exec(win, fail, "IndoorAtlas", "setDistanceFilter", [distance]);
    },

    setSensitivities: function(successCallback, errorCallback, orientationSensitivity, headingSensitivity) {
      var win = function(success) {
        successCallback(success)
      };
      var fail = function(e) {
        if (errorCallback) {
          errorCallback(e);
        }
      };
      exec(win, fail, "IndoorAtlas", "setSensitivities", [orientationSensitivity, headingSensitivity]);
    },

    getFloorCertainty: function(successCallback, errorCallback) {
      var win = function(p) {
          successCallback(p);
      };
      var fail = function(e) {
          if (errorCallback) {
              errorCallback(e);
          }
      };
      exec(win, fail, "IndoorAtlas", "getFloorCertainty");
    },

    getTraceId: function(successCallback, errorCallback) {
      var win = function(p) {
          successCallback(p);
      };
      var fail = function(e) {
          if (errorCallback) {
              errorCallback(e);
          }
      };
      exec(win, fail, "IndoorAtlas", "getTraceId");
    }
};
module.exports = IndoorAtlas;
