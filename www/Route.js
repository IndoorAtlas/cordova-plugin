var RoutingLeg = require('./RoutingLeg');

/**
 * Describes a wayfinding route consisting of `IndoorAtlas.RoutingLeg`s.
 * Obtained with {@link #requestWayfindingUpdates} or {@link #requestWayfindingRoute}
 */
var Route = function(route) {
  if (route) {
    /**
     * Defines the error status of a wayfinding request . One of `NO_ERROR`, `ROUTING_FAILED` or `GRAPH_NOT_AVAILABLE`.
     * @type {string}
     */ 
    this.error = route.error;
    /**
     * Whether route is available.
     * @type {boolean}
     */
    this.isSuccessful = this.error == 'NO_ERROR';
    /**
     * List of legs in this route
     * @type {RoutingLeg[]}
     */
    this.legs = route.legs.map(function (leg) {
      return new RoutingLeg(leg);
    });
  }
};

module.exports = Route;
