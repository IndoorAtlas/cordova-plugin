/**
 * An `IndoorAtlas.Coordinates` object is attached to a `IndoorAtlas.Position`
 * object that is available to callback functions in requests for the current
 * position. It contains a set of properties that describe the geographic
 * coordinates of a position.
 */
var Coordinates = function(data) {
  /**
   * Latitude in decimal degrees
   * @type {number}
   */
  this.latitude = data.latitude;

  /**
   * Longitude in decimal degrees.
   * @type {number}
   */
  this.longitude = data.longitude;

  /**
   * Uncertainty of the position in meters
   * @type {number}
   */
  this.accuracy = data.accuracy;

  /**
   * Direction of travel, specified in degrees counting clockwise relative
   * to the true north
   * @type {number}
   */
  this.heading = (data.heading !== undefined ? data.heading : null);

  /**
   * The floor level (integer) of building as defined in the mapping phase
   * @type {number}
   */
  this.floor = data.flr;
};

module.exports = Coordinates;
