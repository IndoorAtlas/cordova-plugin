/**
 * Region object
 *
 * @constructor
 * @param regionId
 * @param timestamp
 * @param regionType
 * @param transitionType
 * @param floorPlan
 * @param venue
 */
var Region = function(regionId, timestamp, regionType, transitionType, floorPlan, venue) {

  // Region ID
  this.regionId = regionId || '';

  // Timestamp of the region
  this.timestamp = timestamp || null;

  // Type of the region; FLOOR PLAN, VENUE, UNKNOWN
  this.regionType = regionType || null;

  // Transition type of the region; ENTER, EXIT, UNKNOWN
  this.transitionType = transitionType || null;

  // Floor plan object
  this.floorPlan = floorPlan || null;

  // Venue object
  this.venue = venue || null;
};

Region.TRANSITION_TYPE_UNKNOWN = 0;
Region.TRANSITION_TYPE_ENTER = 1;
Region.TRANSITION_TYPE_EXIT = 2;
Region.TYPE_FLOORPLAN = 1;
Region.TYPE_VENUE = 2;
Region.TYPE_UNKNOWN = -1;

module.exports = Region;
