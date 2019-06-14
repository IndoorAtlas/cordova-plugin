var RoutingPoint = require('./RoutingPoint');

/**
 * Wayfinding route leg object
 */
var RoutingLeg = function(data) {

  /**
   * Routing point representing the beginning of this leg.
   * @type {RoutingPoint}
   */
  this.begin = new RoutingPoint(data.begin);

  /**
   * Routing point representing the end of this leg.
   * @type {RoutingPoint}
   */
  this.end = new RoutingPoint(data.end);

  /**
   * Direction of the line segment in ENU coordinates in degrees
   * @type {number}
   */
  this.direction = data.direction;

  /**
   * Zero-based index of the edge corresponding to this leg in the original
   * wayfinding graph. `null` if this leg does not travel along a graph edge,
   * which can happen with the very first and/or the very last leg of the route
   * @type {number}
   */
  this.edgeIndex = (data.edgeIndex === undefined) ? null : data.edgeIndex;

  /**
   * Length of the line segment in meters
   * @type {number}
   */
  this.length = data.length;
};

module.exports = RoutingLeg;
