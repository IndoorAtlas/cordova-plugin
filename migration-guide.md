# Migrating to IndoorAtlas Cordova Plugin 3.x

## Life cycle & error handling

### Old versions 1.x & 2.x

In IndoorAtlas Cordova plugin versions 1.x and 2.x, the initialization
procedure quite complex: positioning could only be started after successfully
initializing the plugin and each method had separate error callbacks. The plugin
also supported multiple "watches" and would only shutdown after each one was
unregistered. The user needed to keep track of the "watch ID" for this purpose.
```javascript
var watchId;
document.addEventListener('deviceready', function () {
  IndoorAtlas.initialize(function () {
    // start positioning
    watchId = IndoorAtlas.watchPosition(
      function (position) {
        // successfully obtained IA location
        console.log(
          "latitude: " + position.coords.latitude + ", " +
          "longitude: " + position.coords.longitude + ", " +
          "floor: " + position.coords.floor);
      }, function (err) { /* handle pos error */ });

    // teardown (stop positioning). Just an example, auto-stop after 60s
    setTimeout(function () {
      if (watchId) IndoorAtlas.clearWatch(watchId)
    }, 60000);

  }, function (err) { /* handle init error */ }, {
    key: YOUR_IA_API_KEY,
    secret: YOUR_IA_API_SECRET
  });
}, false);
```

### New version 3.x

In the new API, starting positioning can (but does not have to be) chained
with initialization. There are no separate "watches" and the error handling is
optional: if you do not provide an error handling callback, errors are logged
in the JS console.
```javascript
document.addEventListener('deviceready', function () {
  // Note: IA_API_SECRET has been deprecated in 3.0
  IndoorAtlas.initialize({ apiKey: YOUR_IA_API_KEY })
    .watchPosition(function (position) {
      // successfully obtained IA location
      console.log(
        "latitude: " + position.coords.latitude + ", " +
        "longitude: " + position.coords.longitude + ", " +
        "floor: " + position.coords.floor);
    });

  // teardown (stop positioning). Just an example, auto-stop after 60s
  // no separate watch IDs
  setTimeout(function () { IndoorAtlas.clearWatch(); }, 60000);

  // error handling (optional)
  IndoorAtlas.onStatusChanged(function (status) {
    if (status == IndoorAtlas.CurrentStatus.OUT_OF_SERVICE) {
      console.error("unrecovable error", status);
    }
  });

}, false);
```
All IA errors are handled through the same status callback.
Note that errors from the plugin are not expected in any normal operation, they
signify things such as incorrect API keys exceptional circumstances such as
out-of-memory errors in the SDK and hence handling them in a single place makes
more sense than separate error callbacks in each API method.

### Removed callback parameters

The useless error  callback parameters were removed from the
following methods

 * `setPosition` (an useless success callback was also removed)
 * `onStatusChanged`
 * `getTraceId`

Other parameters of these methods are unchanged. The `getTraceId` method now
additionally waits until the IA SDK has been initialized before returning the
data to avoid empty trace IDs.

## Region events

### Old versions 1.x & 2.x

In the old SDKs, floor plan and venue context were handled through
_region events_, for example
```javascript
var regionWatch = IndoorAtlas.watchRegion(function enterRegion(region) {
  if (region.regionType == Region.TYPE_FLOORPLAN) {
    // -------- in 1.x only
    IndoorAtlas.fetchFloorPlanWithId(region.regionId, function (floorPlan) {
      console.log("enter floor plan "+floorPlan.name);
    }, function (err) { /* handle errors */ });
    // -------- 2.x only
    console.log("enter floor plan "+region.floorPlan.name);
  } else if (region.regionType == Region.TYPE_VENUE) {
    console.log("enter venue "+this.venueId);
  }
}, function exitRegion(region) {
  if (region.regionType == Region.TYPE_FLOORPLAN) {
    console.log("exit floor plan ID "+region.regionId);
  } else if (region.regionType == Region.TYPE_VENUE) {
    console.log("exit venue ID "+region.regionId);
  }
}, function onError(error) {
  /* handle error */
});

var positionWatch = IndoorAtlas.watchPosition(function (position) {
  // positioning needs to start to receive region events
}, function (error) { /* handle errors */});

// ...

// teardown
IndoorAtlas.clearRegionWatch(regionWatch);
IndoorAtlas.clearWatch(positionWatch);
```

### New version 3.x

In the new plugin, one can directly watch for changes in the floor plan
and/or venue context.
```javascript

// Note: that the second parameter of the callback, "oldFloorPlan"
// is always optional in JavaScript
IndoorAtlas.watchFloorPlan(function (floorPlan, oldFloorPlan) {
  if (floorPlan) {
    console.log("enter floor plan " + floorPlan.name);
  } else {
    console.log("exit floor plan " + oldFloorPlan.name);
  }
});

IndoorAtlas.watchVenue(function (venue, oldVenue) {
  if (venue) {
    console.log("enter venue " + venue.name);
  } else {
    console.log("exit venue " + oldVenue.name);
  }
});

// starting positioning is required to receive context events
IndoorAtlas.watchPosition(function (position) {
  // current floor plan and venue (note: null if outdoors)
  // are also available here.
  console.log("current floor plan " + position.floorPlan);
  console.log("current venue " + position.venue);
});

// ...

// Teardown
IndoorAtlas.clearFloorPlanWatch(); // optional
IndoorAtlas.clearVenueWatch();     // optional

// Stopping positioning will also effectively stop all context events too
// so clearFloorPlanWatch / clearVenueWatch is optional if positioning is
// stopped
IndoorAtlas.clearWatch();

// Error handling: if errors occur (which is unexpected), they are
// reported through onStatusChanged (see "Life cycle & error handling")
```

## Heading callbacks

### Old versions 1.x & 2.x

```javascript
// heading
IndoorAtlas.didUpdateHeading(
  function (result) { console.log("heading: " + result.trueHeading); },
  function (error) { /* handle error */ });

// orientation
IndoorAtlas.didUpdateAttitude(
  function (q) {
    // showcase your math skills with the quaterion [q.x, q.y, q.z, q.w]
  },
  function (error) { /* handle error */ });

// optional: sensitivities
IndoorAtlas.setSensitivities(
  function onSuccess() {},
  function onError(error) { /* handle */ },
  {
    orientationSensitivity: 10.0, // degrees
    headingSensitivity: 4.0 // degrees
  });

// ...

IndoorAtlas.removeHeadingCallback();
IndoorAtlas.removeAttitudeCallback();
```

### New version 3.x

In the new SDK, all of these are unified as `watchOrientation` which can be
used as a drop-in replacement for `didUpdateHeading`, but also returns
the orientation information (whose usage is naturally optional)

```javascript
IndoorAtlas.watchOrientation(
  function (orientation) {
    // heading update
    console.log("heading: " + orientation.trueHeading);

    // other Euler angles are available too
    console.log("yaw: " + orientation.yaw + ", pitch: " + orientation.pitch);

    // if you like, you can still access the orientation quaternion
    // as orientation.quaternion
  },
  // optional options structure
  {
    minChangeDegrees: 4.0 // sensitivity in degrees
  });

// ...

// teardown is optional if you stop positioning
IndoorAtlas.clearOrientationWatch();
// unexpected errors reported through onStatusChanged
```


## Distance filter

### Old

```javascript
IndoorAtlas.setDistanceFilter(
  function onSuccess() {},
  function onError(error) { /* handle */ },
  {
    distance: 10.0 // meters
  });
```

### New

The distance filter is now given as an optional second parameter to `watchPosition`

```javascript
IndoorAtlas.watchPosition(
  function (position) {
    // ...
  },
  {
    minChangeMeters: 10.0
  });
```

## Floor certainty

Instead of the `getFloorCertainty` method, floor certainty is now available
as a field in the location object returned by `watchPosition`.

## Removed features

The `getCurrentPosition` method was considered harmful and removed entirely.
Use `watchPosition` instead. You could reimplement the functionality of the
removed method by simply calling `clearWatch` after obtaining the first location.

# How to keep using the old version

If you can't migrate right now, you can still use the version 2.10.x by specifying the exact version in your `config.xml` file, for example,
```xml
<plugin
  name="cordova-plugin-indooratlas"
  spec="git+https://github.com/IndoorAtlas/cordova-plugin.git#2.10.1" />
```
For examples on how the old API was used, see https://github.com/IndoorAtlas/sdk-cordova-examples/tree/legacy-version-2-10.
The documentation for the old version is available at https://docs.indooratlas.com/apidocs/cordova-v2.
