/**
 * # IndoorAtlas Cordova/React.Native plugin v3
 *
 * All functions that are part of the IndoorAtlas Cordova plugin are scoped
 * under the `IndoorAtlas` singleton object. For example the function
 *  {@link #initialize} can be used in code as `IndoorAtlas.initialize(...)`.
 *
 * Most classes returned by the plugin, such as {@link FloorPlan}
 * (= `IndoorAtlas.FloorPlan`) are not supposed to be constructed by the user
 * directly. The only exception is {@link Geofence|IndoorAtlas.Geofence}.
 *
 * ## Basic usage
 *
 * _Before you start, make sure you are familiar with the
 * [main phases](https://indooratlas.freshdesk.com/support/solutions/articles/36000079590-indooratlas-positioning-overview)
 * of deploying IndoorAtlas technology. In particular, your physical location
 * must be fingeprinted with the IndoorAtlas Map Creator 2 application before
 * any of the below APIs will return meaningful values._
 *
 * First, add IndoorAtlas plugin to the `config.xml` file of your project
 * ```xml
 * <plugin name="react-native-plugin-indooratlas" spec="git+https://github.com/IndoorAtlas/cordova-plugin.git#react-native" />
 * ```
 * TODO react.native
 * Then you can initialize in Cordova's "deviceready" callback or later, e.g.,
 * ```javascript
 * document.addEventListener('deviceready', () => {
 *   // start positioning
 *   IndoorAtlas.initialize({ apiKey: YOUR_IA_API_KEY })
 *    .watchPosition(position => {
 *      console.log(
 *        "latitude: " + position.coords.latitude + ", " +
 *        "longitude: " + position.coords.longitude + ", " +
 *        "floor: " + position.coords.floor);
 *   });
 *
 *   // auto-stop positioning after 60 seconds
 *   setTimeout(() => IndoorAtlas.clearWatch(), 60000);
 * }, false);
 * ```
 * All methods return the `IndoorAtlas` singleton object to allow chaining
 * like in the above example.
 */
var ___; // this dummy variable helps with automatic docs generation

// react.native
var pluginVersion = require('react-native-indooratlas/package.json').version;
var isAndroid = require('@remobile/react-native-cordova').isandroid;
var cordovaExec = require('@remobile/react-native-cordova').exec;
import { NativeEventEmitter, NativeModules } from 'react-native';
var eventEmitter = new NativeEventEmitter(NativeModules.IndoorAtlas);
var Position = require('./Position');
var RegionChangeObserver = require('./RegionChangeObserver');
var CurrentStatus = require('./CurrentStatus');
var Orientation = require('./Orientation');
var Route = require('./Route');
var Geofence = require('./Geofence');

// --- Helper functions and constants (*not* in the global scope)

var DEFAULT_WATCH_ID = 'default-watch';
var DEFAULT_REGION_WATCH_ID = 'default-region-watch';

// react.native
function getDeviceType() {
  if (isAndroid) return 'Android';
  else return 'iOS';
}

function isNumber(value) {
  return typeof value === 'number' && isFinite(value);
}

function isInteger(value) {
  // official Mozilla polyfill for Number.isInteger
  return typeof isNumber(value) && Math.floor(value) === value;
}

function isNonNegativeNumber(value) {
  return typeof isNumber(value) && value >= 0;
}

function IndoorAtlas() {

  // --- Private state variables
  // react.native
  var subscriptions = {};
  var callbacks = {};
  var initialized = false;
  var indoorLock = null;
  var floorLock = null;
  var wayfindingDestination = null;
  var positioningOptions = null;
  var orientationFilter = null;
  var regionChangeObserver = null;
  var statusHasBeenAvailable = false;

  var self = this;
  var debug = false;

  // --- Private methods

  function warning(message) {
    console.warn('IndoorAtlas WARNING: ' + message);
    return self;
  }

  // none of the Cordova callbacks are supposed to fail, always report
  // as status OUT_OF_SERVICE if something like this happens
  function error(result) {
    var message = 'internal error ' + JSON.stringify(result);
    console.error('IndoorAtlas ERROR: ' + message);
    if (callbacks.onStatus) {
      callbacks.onStatus(CurrentStatus.OUT_OF_SERVICE, message);
    }
  }

  // react.native
  function native(methodName, options, onSuccess) {
      function successCallback(result) {
        if (debug) debug(methodName + " completed " + JSON.stringify(result));
        if (onSuccess) onSuccess(result);
      }

      if (debug) debug('executing '+methodName+'(' + JSON.stringify(options) + ')');
      if (subscriptions[methodName]) {
        subscriptions[methodName].remove();
      }
      subscriptions[methodName] = eventEmitter.addListener(methodName, successCallback);
      cordovaExec(successCallback, error, 'IndoorAtlas', methodName, options);
  }

  function requestWayfinding() {
    var destination = wayfindingDestination;
    native('requestWayfindingUpdates', [destination.latitude, destination.longitude, destination.floor], function (route) {
      // this check causes the updates to stop instantly when wayfinding is stopped,
      // even if some updates would be pending in some native thread
      if (callbacks.onWayfindingRoute) callbacks.onWayfindingRoute(new Route(route));
    });
  }
  
  function requestWayfindingRoute(from, to, onWayfindingRoute) {
    native('requestWayfindingRoute', [from, to], function (route) {
      onWayfindingRoute(new Route(route));
    });
  }

  function stopWayfinding() {
    native('removeWayfindingUpdates', []);
  }

  function requestGeofenceUpdates() {
    if (debug) debug('add geofence watch');
    native('watchGeofences', [], function (result) {
      if (callbacks.onTriggeredGeofence) {
        callbacks.onTriggeredGeofence(result.transitionType, Geofence.fromGeoJSON(result.geoJson));
      }
    });
  }

  function removeGeofenceUpdates() {
    if (debug) debug('clear geofence watch');
    native('clearGeofenceWatch', []);
  }

  function startPositioning() {
    if (debug) debug('starting positioning');

    regionChangeObserver = new RegionChangeObserver(function (newFloorPlan, oldFloorPlan) {
      if (callbacks.onFloorPlanChange) {
        callbacks.onFloorPlanChange(newFloorPlan, oldFloorPlan);
      }
    }, function (newVenue, oldVenue) {
      if (callbacks.onVenueChange) {
        callbacks.onVenueChange(newVenue, oldVenue);
      }
    }, error);

    // before addWatch to avoid unnecessary pos restart
    if (positioningOptions && (positioningOptions.minChangeMeters > 0 || positioningOptions.minIntervalSeconds > 0)) {
      var minChangeMeters = positioningOptions.minChangeMeters || 0;
      var minIntervalSeconds = positioningOptions.minIntervalSeconds || 0;
      native('setOutputThresholds', [minChangeMeters, minIntervalSeconds]);
    }
    
    if (positioningOptions && positioningOptions.positioningMode) {
      if (!['HIGH_ACCURACY','LOW_POWER','CART'].includes(positioningOptions.positioningMode)) {
        throw new Error('Invalid positioning mode: ' + positioningOptions.positioningMode);
      }
      native('setPositioningMode', [positioningOptions.positioningMode]);
    }

    native('addWatch', [DEFAULT_WATCH_ID, null], function (data) {
      if (callbacks.onLocation) {
        data.floorPlan = regionChangeObserver.getCurrentFloorPlan();
        data.venue = regionChangeObserver.getCurrentVenue();
        callbacks.onLocation(new Position(data));
      }
    });

    native('addRegionWatch', [DEFAULT_REGION_WATCH_ID], function (r) {
      regionChangeObserver.onRegionEvent(r);
    });

    // handle floor and indoor locks if set before initialized
    if (indoorLock !== null) self.lockIndoors(indoorLock);
    if (floorLock !== null) self.lockFloor(floorLock);

    if (callbacks.onWayfindingRoute) {
      requestWayfinding();
    }

    // automatically request, but just don't use the results if not wanted
    // in JS. Simplifies the code
    native('addAttitudeCallback', [], function (orientation) {
      if (callbacks.onOrientation) callbacks.onOrientation(new Orientation(orientation));
    });

    // after addAttitudeCallback on purpose
    if (orientationFilter && orientationFilter.minChangeDegrees > 0) {
      var orientationSensitivity = orientationFilter.minChangeDegrees;
      var headingSensitivity = 1000; // no heading callbacks needed
      native('setSensitivities', [orientationSensitivity, headingSensitivity]);
    }
  }

  function stopPositioning() {
    if (debug) debug('stopping positioning');
    native('clearWatch', [DEFAULT_WATCH_ID]);
    native('clearRegionWatch', [DEFAULT_REGION_WATCH_ID]);
    native('clearGeofenceWatch', []);
    native('removeAttitudeCallback', []);
    native('removeHeadingCallback', []);
    native('removeStatusCallback', []);
    native('removeWayfindingUpdates', []); // just in case

    positioningOptions = null;
    orientationFilter = null;

    // reset locks
    indoorLock = null;
    floorLock = null;
  }

  // ################ PUBLIC API ################

  // --- Error and status reporting

  // undocumented helper method for enabling internal debug logs
  this._debug = function(enabled) {
    function debugPrint(msg) {
      console.log('IndoorAtlas DEBUG: ' + msg);
    }
    debug = (enabled === undefined || enabled) ? debugPrint : null;
    return self;
  };

  // --- Configuration

  /**
   * Initializes IndoorAtlas location manager object with provided API key.
   * Must be called before using other methods. Should be called in Cordova's
   * TODO react.native
   * [deviceready](https://cordova.apache.org/docs/en/9.x/cordova/events/events.html#deviceready)
   * callback or later.
   *
   * @param {object} configuration
   * @param {string} configuration.apiKey IndoorAtlas API key
   * @return {object} returns `this` to allow chaining
   * @example
   * IndoorAtlas.initialize({ apiKey: "3795eee9-efaf-47db-8347-316b6bb0c834" })
   */
  this.initialize = function (configuration) {
    var apiKey = configuration.apiKey;
    if (!apiKey) throw new Error('Invalid configuration: no API key');

    function initSuccess() {
      if (debug) debug('init success');
      initialized = true;

      native('addStatusChangedCallback', [], function (status) {
        lastStatus = new CurrentStatus(status.code, status.message);
        if (lastStatus.name === 'AVAILABLE') {
          if (debug) debug('status available');
          var wasAvailable = statusHasBeenAvailable;
          statusHasBeenAvailable = true;
          if (!wasAvailable && callbacks.onTraceId) {
            // trace ID is available if the status has been "available" at
            if (debug) debug('get trace ID after first available status');
            self.getTraceId(callbacks.onTraceId);
          }
          statusHasBeenAvailable = true;
        }
        if (callbacks.onStatus) {
          callbacks.onStatus(lastStatus);
        }
      });

      if (callbacks.onLocation) startPositioning();

      if (callbacks.onTriggeredGeofence) requestGeofenceUpdates();
    }

    var config = [apiKey, 'dummy-secret'];
    // plugin version
    config.push(pluginVersion);
    if (getDeviceType() == 'Android') {
      // get permission
      native('getPermissions', [], function () {
        native('initializeIndoorAtlas', config, initSuccess);
      });
    } else {
      native('initializeIndoorAtlas', config, initSuccess);
    }

    return self;
  };

  // --- Positioning

  /**
   * Starts IndoorAtlas positioning
   *
   * @param {function(Position)} onPosition a callback that executes when the
   * position changes  with an `IndoorAtlas.Position` object as the parameter.
   * @param {object} options positioning options (optional)
   * @param {number} options.minChangeMeters (optional) Distance filter.
   * If set, determines the minimum distance (in meters) the position has to
   * change before the next position is reported. If not set, all changes in
   * position are returned, which happens approximately once a second.
   * @param {number} options.minIntervalSeconds (optional) Time filter.
   * The minimum amount of time measured in seconds that must be elapsed
   * before an update event is generated. Setting this to 0 disables time based updates.
   * Maximum update frequency is determined from values of distance filter and time filter.
   * Update is generated when either of conditions specified by these filters are met. Default value is 2.
   * @param {string} options.positioningMode (optional) positioning mode.
   * One of: `HIGH_ACCURACY`, `LOW_POWER` or `CART`.  Default is `HIGH_ACCURACY`
   * @return {object} returns `this` to allow chaining
   * @example
   * IndoorAtlas.watchPosition(position => {
   *     console.log(`
   *         ${position.coords.latitude}
   *         ${position.coords.longitude}
   *         ${position.coords.floor}`);
   * });
   */
  this.watchPosition = function(onPosition, options) {
    if (callbacks.onLocation) {
      callbacks.onLocation = onPosition;
      return warning('Positioning already started, overwriting existing watch');
    }
    callbacks.onLocation = onPosition;

    positioningOptions = options;

    if (initialized) startPositioning();
    // otherwise successful initialization will start positioning

    return self;
  };

  /**
   * Stops IndoorAtlas positioning. Also clears any other watches.
   *
   * @return {object} returns `this` to allow chaining
   * @example
   * IndoorAtlas.watchPosition(position => {
   *    // do some positioning
   * });
   * // stop after 10 seconds
   * setTimeout(() => { IndoorAtlas.clearWatch(); }, 10000);
   */
  this.clearWatch = function() {
    if (!callbacks.onLocation) {
      return warning('Positioning not started');
    }
    delete callbacks.onLocation;
    // NOTE: other watches are cleared as well
    stopPositioning();
    // react.native
    for (const [_, value] of Object.entries(subscriptions)) {
      value.remove();
    }
    subscriptions = {};
    return self;
  };

  // --- Floor plans & venues

  /**
   * Start observing floor plan changes
   *
   * @param {function(FloorPlan)} onFloorPlanChange a callback that executes
   * when the floor plan changes. `null` if not currently on any floor plan.
   * @return {object} returns `this` to allow chaining
   * @example
   * IndoorAtlas.watchFloorPlan(floorPlan => {
   *     if (floorPlan) {
   *         console.log(`entered floor plan ${floorPlan.name}`);
   *     }
   * });
   */
  this.watchFloorPlan = function(onFloorPlanChange) {
    if (callbacks.onFloorPlanChange) {
      warning('Overwriting existing floor plan watch');
    }
    callbacks.onFloorPlanChange = onFloorPlanChange;
    return self;
  };

  /**
   * Stop observing floor plan changes
   * @return {object} returns `this` to allow chaining
   */
  this.clearFloorPlanWatch = function() {
    if (!callbacks.onFloorPlanChange) {
      return warning('No floor plan watch to clear');
    }
    delete callbacks.onFloorPlanChange;
    return self;
  };

  /**
   * Start observing venue changes
   *
   * @param {function(Venue)} onVenueChange a callback that executes
   * when the venue changes. `null` if not currently near any venue.
   * @return {object} returns `this` to allow chaining
   */
  this.watchVenue = function(onVenueChange) { // TODO: venue object
    if (callbacks.onVenueChange) {
      warning('Overwriting existing venue watch');
    }
    callbacks.onVenueChange = onVenueChange;
    return self;
  };

  /**
   * Stop observing venue changes
   * @return {object} returns `this` to allow chaining
   */
  this.clearVenueWatch = function() {
    if (!callbacks.onVenueChange) {
      return warning('No venue watch to clear');
    }
    delete callbacks.onVenueChange;
    return self;
  };

  // --- Status changes

  /**
   * Start observing status changes
   *
   * @param {function(CurrentStatus)} onStatus a callback that executes
   * when the IndoorAtlas service status changes.
   * @return {object} returns `this` to allow chaining
   * @example IndoorAtlas.onStatusChanged(console.log);
   */
  this.onStatusChanged = function(onStatus) {
    callbacks.onStatus = onStatus;
    return self;
  };

  /**
   * Stop observing status changes
   * @return {object} returns `this` to allow chaining
   */
  this.removeStatusCallback = function() {
    delete callbacks.onStatus;
    return self;
  };

  // --- Heading & orientation
  /**
   * Start observing for device orientation & heading changes
   *
   * @param {function(Orientation)} onOrientation a callback that executes
   * when the orientation of the device changes. Contains the heading and
   * other orientation angles.
   * @param {object} options distance filter options (optional)
   * @param {number} options.minChangeDegrees (optional) Change filter.
   * If set, determines the minimum angle in degrees that the device has to
   * be rotated (about any axis) before a new orientation is reported.
   * @return {object} returns `this` to allow chaining
   * @example
   * IndoorAtlas.watchOrientation(orientation => {
   *     console.log(`heading: ${orientation.trueHeading} degrees`);
   * });
   */
  this.watchOrientation = function(onOrientation, options) {
    callbacks.onOrientation = onOrientation;
    orientationFilter = options;
    return self;
  };

  /**
   * Stop observing orientation changes
   * @return {object} returns `this` to allow chaining
   */
  this.clearOrientationWatch = function() {
    delete callbacks.onOrientation;
    return self;
  };

  // --- Wayfinding

  /**
   * Request wayfinding from the current location of the user to the given
   * coordinates. Also a {@link #POI} can be given as a destination.
   *
   * @param {(object | POI)} destination
   * @param {number} destination.latitude Destination latitude in degrees
   * @param {number} destination.longitude Destination longitude in degrees
   * @param {number} destination.floor Destination floor number as defined in
   * the mapping phase
   * @param {function(Route)} onWayfindingRoute a callback that executes
   * when the user's location is changed, gives the shortest route to the
   * given destination as an object `{ legs }`, where `legs` is a
   * list of `IndoorAtlas.RouteLeg` objects.
   * @return {object} returns `this` to allow chaining
   * @example
   * const destination = { latitude: 60.16, longitude: 24.95, floor: 2 };
   * IndoorAtlas.requestWayfindingUpdates(destination, route => {
   *     console.log(`the route has ${route.legs.length} leg(s)`);
   * });
   */
  this.requestWayfindingUpdates = function (destination, onWayfindingRoute) {
    callbacks.onWayfindingRoute = onWayfindingRoute;
    wayfindingDestination = destination;
    if (initialized) requestWayfinding();
    return self;
  };

  /**
   * Stop wayfinding. Typically called after arriving to the destination
   * (determined with {@link #requestWayfindingUpdates}) or if the user
   * cancels the wayfinding session.
   *
   * @return {object} returns `this` to allow chaining
   * @example IndoorAtlas.removeWayfindingUpdates()
   */
  this.removeWayfindingUpdates = function() {
    delete callbacks.onWayfindingRoute;
    wayfindingDestination = null;
    if (initialized) stopWayfinding();
    return self;
  };

  /**
   * Request a single-shot wayfinding route.
   * Also a {@link #POI} can be given as a source or destination.
   *
   * @param {(object | POI)} from
   * @param {number} from.latitude Starting location latitude in degrees
   * @param {number} from.longitude Starting location longitude in degrees
   * @param {number} from.floor Starting location floor number as defined in
   * the mapping phase
   * @param {(object | POI)} to
   * @param {number} to.latitude Destination latitude in degrees
   * @param {number} to.longitude Destination longitude in degrees
   * @param {number} to.floor Destination floor number as defined in
   * the mapping phase
   * @param {function(Route)} onWayfindingRoute a callback that executes
   * with the shortest route to the
   * given destination as an object `{ legs }`, where `legs` is a
   * list of `IndoorAtlas.RouteLeg` objects.
   * @return {object} returns `this` to allow chaining
   * @example
   * const from = { latitude: 60.16, longitude: 24.95, floor: 2 };
   * const to = { latitude: 60.161, longitude: 24.951, floor: 3 };
   * IndoorAtlas.requestWayfindingRoute(from, to, route => {
   *     console.log(`the route has ${route.legs.length} leg(s)`);
   * });
   */
  this.requestWayfindingRoute = function (from, to, onWayfindingRoute) {
    if (initialized) requestWayfindingRoute(from, to, onWayfindingRoute);
    return self;
  };
 
  // --- Geofences

  /**
   * Callback function triggered on geofence events
   *
   * @callback geofenceCallback
   * @param {string} transitionType Event type, either `'ENTER'`, `'EXIT'` or `'UNKNOWN'`
   * @param {Geofence} geofence Triggered geofence.
   */

  /**
   * Start monitoring for geofence events (entering or exiting geofences).
   *
   * @param {geofenceCallback} onTriggeredGeofence A callback which
   * is executed when a geofence is entered or exited.
   * @return {object} Returns `this` to allow chaining
   */

  this.watchGeofences = function (onTriggeredGeofence) {
    callbacks.onTriggeredGeofence = onTriggeredGeofence;
    if (initialized) {
      requestGeofenceUpdates();
    }
    return self;
  };

  /**
   * Stop monitoring enter/exit events for geofences.
   *
   * @return {object} Returns `this` to allow chaining
   */

  this.clearGeofenceWatch = function() {
    delete callbacks.onTriggeredGeofence;
    if (initialized) {
      removeGeofenceUpdates();
    }
    return self;
  };

  /**
   * Add a geofence to be monitored for enter/exit.
   *
   * @param {Geofence} geofence The geofence to be monitored.
   * @return {object} Returns `this` to allow chaining
   *
   * @example
   * IndoorAtlas.addDynamicGeofence(new IndoorAtlas.Geofence({
   *   id: '12345678-90ab-cdef-1234-567890abcdef',
   *   name: 'My geofence',
   *   floor: 1,
   *   coordinates: [
   *     [65.1234, 25.51234],
   *     [65.1254, 25.51234],
   *     [65.1254, 25.51334],
   *     [65.1234, 25.51334],
   *     [65.1234, 25.51234]
   *   ]
   * }));
   */
  this.addDynamicGeofence = function (geofence) {
    native('addDynamicGeofence', [geofence.toGeoJSON()]);
    return self;
  }

  /**
   * Removes a dynamic geofence from being monitored.
   *
   * @param {(string|Geofence)} geofence Either a {@link Geofence} object or a geofence ID string.
   * @return Returns `this` to allow chaining
   * @example <caption>Provide a whole geofence object</caption>
   * var geofence = new IndoorAtlas.Geofence({ ... });
   * // ...
   * IndoorAtlas.removeDynamicGeofence(geofence);
   * @example <caption>Or just an geofence ID string</caption>
   * IndoorAtlas.removeDynamicGeofence('12345678-90ab-cdef-1234-567890abcdef');
   */
  this.removeDynamicGeofence = function (geofence) {
    native('removeDynamicGeofence', [geofence.toGeoJSON()]);
    return self;
  }

  // --- Locks and explicit positions

  /**
   * Indicate current location to positioning service. This method can be used
   * to pass a hint to the system e.g. when location is already known. This is
   * completely optional and should only be used to shorten time it takes for
   * the first fix. It is not recommended that this method is called with
   * approximate locations with low or medium accuracy.
   *
   * @param {object} position
   * @param {number} position.latitude Latitude in degrees
   * @param {number} position.longitude Longitude in degrees
   * @param {number} position.floor Integer floor number (optional)
   * @param {number} position.accuracy Accuracy radius in meters (optional)
   * @return {object} returns `this` to allow chaining
   * @example
   * IndoorAtlas.setPosition({ latitude: 60.16, longitude: 24.95, floor: 2 });
   */
  this.setPosition = function(position) {
    if (!isNumber(position.latitude) || !isNumber(position.longitude)) throw new Error('setPosition: invalid or missing coordinates');
    if (position.hasOwnProperty('floor') && !isInteger(position.floor)) throw new Error('setPosition: invalid floor number');
    if (position.hasOwnProperty('accuracy') && !isNonNegativeNumber(position.accuracy)) throw new Error('setPosition: invalid accuracy value')

    if (initialized) native('setPosition', [position.latitude, position.longitude, position.floor, position.accuracy]);
    // otherwise just ignrore
    return self;
  };

  /**
   * Enable or disable indoor-outdoor detection. Disabled by default.
   *
   * @param {boolean} locked if `false`, enable automatic indoor-outdoor detection.
   * If `true`, disable automatic indoor-outdoor detection and keep positioning indoors.
   * @return {object} returns `this` to allow chaining
   * @example IndoorAtlas.lockIndoors(false);
   */
  this.lockIndoors = function(locked) {
    // notice that since all parameters are optional in JavaScript, we cannot
    // avoid users calling lockIndoors(). This is interpreted as enabling
    // IndoorLock (instead of .lockIndoors(false)) to avoid confusion.
    indoorLock = !!locked || locked === undefined;
    if (initialized) native('lockIndoors', [indoorLock]);
    // else handled in startPositioning
    return self;
  };

  /**
   * Disable automatic floor detection and lock the floor level to a given number
   *
   * @param {number} floorNumber The floor number (integer) to lock the
   * positioning to. Use floor nubmers as defined in the mapping phase
   * @return {object} returns `this` to allow chaining
   * @example IndoorAtlas.lockFloor(3);
   */
  this.lockFloor = function(floorNumber) {
    if (!isInteger(floorNumber)) throw new Error('floorNumber must be an integer');
    floorLock = floorNumber;
    if (initialized) native('lockFloor', [floorLock]);
    // else handled in startPositioning
    return self;
  };

  /**
   * Re-enable automatic floor detection after locking the floor
   * with {@link #lockFloor}
   * @return {object} returns `this` to allow chaining
   * @example IndoorAtlas.unlockFloor();
   */
  this.unlockFloor = function() {
    floorLock = null;
    if (initialized) native('unlockFloor', []);
    // else handled in startPositioning
    return self;
  };

  /**
   * Returns the IndoorAtlas trace ID for this session in a callback.
   * @param {function(string)} onTraceId A callback that returns the trace
   * ID string. Called only once on success.
   * @return {object} returns `this` to allow chaining
   * @example IndoorAtlas.getTraceId(traceId => console.log(traceId));
   */
  this.getTraceId = function(onTraceId) {
    callbacks.onTraceId = onTraceId;
    if (statusHasBeenAvailable) {
        native('getTraceId', [], function (traceId) {
        // this might lose some trace IDs if this is called rapidly
        if (callbacks.onTraceId) {
          callbacks.onTraceId(traceId.traceId);
          delete callbacks.onTraceId;
        }
      });
    }
    return self;
  };
}

module.exports = new IndoorAtlas();
