var FloorPlan = require('./FloorPlan');

/**
 * A data object describing a venue, also known as a _building_ or _location_.
 * Can be obtained with {@link #watchVenue} or as the {@link Position#venue}
 * member of the object returned by {@link #watchPosition}.
 */
var Venue = function(data) {
  /**
   * IndoorAtlas venue ID. Also known as _location ID_.
   * @type {string}
   * @example "bd169e67-33a9-418d-a3e3-caf98ff01877"
   */
  this.id = data.id;

  /**
   * Venue name
   * @type {string}
   * @example "Local Shopping Mall"
   */
  this.name = data.name;

  /**
   * List of floor plans in this venue
   * @type {FloorPlan[]}
   */
  this.floorPlans = data.floorPlans.map(function (floorPlanData) {
    return new FloorPlan(floorPlanData);
  });
};

module.exports = Venue;
