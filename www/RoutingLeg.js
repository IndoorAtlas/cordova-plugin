/**
 * RoutingLeg object
 *
 * @constructor
 * @param begin
 * @param direction
 * @param edgeIndex
 * @param end
 * @param length
 */
var RoutingLeg = function(begin, direction, edgeIndex, end, length) {
  this.begin = begin;
  this.direction = direction;
  this.edgeIndex = (edgeIndex === undefined) ? null : edgeIndex;
  this.end = end;
  this.length = length;
};

module.exports = RoutingLeg;
