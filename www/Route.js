var RoutingLeg = require('./RoutingLeg');

/**
 * Describes a wayfinding route consisting of `IndoorAtlas.RoutingLeg`s.
 * Obtained with {@link #requestWayfindingUpdates}
 */
var Route = function(data) {
  if (data) {
    /**
     * List of legs in this route
     * @type {RoutingLeg[]}
     */
    this.legs = data.legs.map(function (leg) {
      return new RoutingLeg(leg);
    });
  }
};

module.exports = Route;
