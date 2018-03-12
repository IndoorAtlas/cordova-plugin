var Coordinates = require('./Coordinates');
var Region = require('./Region');

var Position = function(coords, region, timestamp, floorCertainty) {
  if (coords) {
    this.coords = new Coordinates(coords.latitude, coords.longitude,
                                  coords.altitude, coords.accuracy,
                                  coords.heading, coords.speed, coords.flr);
  } else {
    this.coords = new Coordinates();
  }

  if (region) {
    this.region = new Region(region.regionId, region.timestamp,
                             region.regionType, region.transitionType);
  }
  else {
    this.region = null;
  }
  this.timestamp = (timestamp !== undefined) ? timestamp : Date.now();
  this.floorCertainty = floorCertainty;
};

module.exports = Position;
