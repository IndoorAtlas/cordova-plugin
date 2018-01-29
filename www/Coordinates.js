/**
 * This class contains position information.
 * @param {Object} lat
 * @param {Object} lng
 * @param {Object} alt
 * @param {Object} acc
 * @param {Object} head
 * @param {Object} vel
 * @param {Object} altacc
 * @constructor
 */
var Coordinates = function(lat, lng, alt, acc, head, vel, flr) {
  // The latitude of the position.
  this.latitude = lat;

  // The longitude of the position,
  this.longitude = lng;

  // The accuracy of the position.
  this.accuracy = acc;

  // The altitude of the position.
  this.altitude = (alt !== undefined ? alt : null);

  // The direction the device is moving at the position.
  this.heading = (head !== undefined ? head : null);

  // The velocity with which the device is moving at the position.
  this.speed = 0;

  // The altitude accuracy of the position.
  this.altitudeAccuracy = null;

  // The floor of the position.
  this.floor = flr;
};

module.exports = Coordinates;
