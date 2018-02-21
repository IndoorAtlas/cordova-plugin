/**
 * RoutingPoint object
 *
 * @constructor
 * @param latitude
 * @param longitude
 * @param floor
 * @param nodeIndex
 */
var RoutingPoint = function(latitude, longitude, floor, nodeIndex) {
  this.latitude = latitude;
  this.longitude = longitude;
  this.floor = floor;
  this.nodeIndex = (nodeIndex === undefined) ? null : nodeIndex;
};

module.exports = RoutingPoint;
