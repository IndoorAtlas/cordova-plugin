var FloorPlan = require('./FloorPlan');
var Venue = require('./Venue');

// internal helper class: transforms exit-enter pairs to single change events
function ChangeDetector(onChangeCallback, exitDelayMs) {
  var currentId = null;

  function checkExit(exitedId) {
    if (currentId === exitedId) {
      onChangeCallback(null);
    }
  }

  this.onEnter = function(id, obj) {
    currentId = id;
    onChangeCallback(obj);
  };

  this.onExit = function(id) {
    setTimeout(function () {
      checkExit(id);
    }, exitDelayMs);
  };
}

// internal helper class
function RegionChangeObserver(onFloorPlanChange, onVenueChange, onError) {
  var currentFloorPlan = null;
  var currentVenue = null;

  var FLOOR_PLAN_EXIT_DELAY_MS = 100;
  // causes the exit callbacks to arrive in a more logical order
  var VENUE_EXIT_DELAY_MS = 150;

  var floorPlanChangeDetector = new ChangeDetector(function (floorPlan) {
    onFloorPlanChange(floorPlan, currentFloorPlan);
    currentFloorPlan = floorPlan;
  }, FLOOR_PLAN_EXIT_DELAY_MS);

  var venueChangeDetector = new ChangeDetector(function (venue) {
    onVenueChange(venue, currentVenue);
    currentVenue = venue;
  }, VENUE_EXIT_DELAY_MS);

  var TRANSITION_TYPE_ENTER = 1;
  var TRANSITION_TYPE_EXIT = 2;
  var TYPE_FLOORPLAN = 1;
  var TYPE_VENUE = 2;

  this.onRegionEvent = function (region) {
    var floorPlan = null, venue = null;
    if (region.floorPlan) {
      floorPlan = new FloorPlan(region.floorPlan);
    }
    if (region.venue) {
      venue = new Venue(region.venue);
    }

    if (region.transitionType == TRANSITION_TYPE_ENTER) {
      if (region.regionType == TYPE_FLOORPLAN) {
        if (floorPlan) {
          floorPlanChangeDetector.onEnter(region.regionId, floorPlan);
        } else {
          onError('missing floor plan object'); // could happend on SDK bugs
        }
      } else if (region.regionType == TYPE_VENUE) {
        if (venue) {
          venueChangeDetector.onEnter(region.regionId, venue);
        } else {
          onError('missing venue object');  // could happend on SDK bugs
        }
      }
    } else {
      if (region.regionType == TYPE_FLOORPLAN) {
        floorPlanChangeDetector.onExit(region.regionId);
      }  else if (region.regionType == TYPE_VENUE) {
        venueChangeDetector.onExit(region.regionId);
      }
    }
  };

  this.getCurrentFloorPlan = function () {
    return currentFloorPlan;
  };

  this.getCurrentVenue = function () {
    return currentVenue;
  }
}

module.exports = RegionChangeObserver;
