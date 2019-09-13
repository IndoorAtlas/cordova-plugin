/**
 * Wayfinding route point
 */
var RoutingPoint = function(data) {
  /**
   * Latitude in degrees
   * @type {number}
   */
  this.latitude = data.latitude;

  /**
   * Longitude in degrees
   * @type {number}
   */
  this.longitude = data.longitude;

  /**
   * Integer floor number
   * @type {number}
   */
  this.floor = data.floor;

  /**
   * Index / ID of this routing point in the original wayfinding graph.
   * `null` if this point is not a part of the original graph. This happens
   * with the begin and end points of the route.
   * @type {number}
   */
  this.nodeIndex = (data.nodeIndex === undefined) ? null : data.nodeIndex;
};

module.exports = RoutingPoint;
