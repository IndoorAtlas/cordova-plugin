var Coordinates = require('./Coordinates');

/**
 * Describes an indoor or outdoor location with coordinates, uncertainties and
 * metadata such as IndoorAtlas floor plan and venue objects.
 */
var Position = function(data) {
  /**
   * A set of geographic coordinates
   * @type {Coordinates}
   */
  this.coords = new Coordinates(data);

  /**
   * The `IndoorAtlas.FloorPlan` associated with this location or `null`
   * @type {FloorPlan}
   */
  this.floorPlan = data.floorPlan;

  /**
   * The `IndoorAtlas.Venue` associated with this location or `null`
   * @type {Venue}
   */
  this.venue = data.venue;

  /**
   * Creation timestamp for coords.
   * @type {Date}
   */
  this.timestamp = (data.timestamp !== undefined) ? data.timestamp : Date.now(); // TODO: useless, remove

  /**
   * Floor certainty in ranging from 0 (uncertain) to 1 (most certain)
   * @type {number}
   */
  this.floorCertainty = data.floorCertainty;
};

module.exports = Position;
