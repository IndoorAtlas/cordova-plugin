/**
 * Region object
 *
 * @constructor
 * @param regionId
 * @param timestamp
 * @param regionType
 * @param transitionType
 */
var Region = function(regionId, timestamp, regionType, transitionType) {
  this.regionId = regionId || '';
  this.timestamp = timestamp || null;
  this.regionType = regionType || null;
  this.transitionType = transitionType || null;
};

Region.TRANSITION_TYPE_UNKNOWN = 0;
Region.TRANSITION_TYPE_ENTER = 1;
Region.TRANSITION_TYPE_EXIT = 2;
Region.TYPE_FLOORPLAN = 1;
Region.TYPE_UNKNOWN = -1;

module.exports = Region;
