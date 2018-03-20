var CoordinateTransforms = require('./CoordinateTransforms');

/**
 * This class contains position information.
 * @param {Object} id
 * @param {Object} name
 * @param {Object} url
 * @param {Object} floorLevel
 * @param {Object} bearing
 * @param {Object} bitmapHeight
 * @param {Object} bitmapWidth
 * @param {Object} heightMeters
 * @param {Object} widthMeters
 * @param {Object} metersToPixels
 * @param {Object} pixelsToMeters
 * @param {Object} bottomLeft
 * @param {Object} center
 * @param {Object} topLeft
 * @param {Object} topRight
 * @constructor
 */
var FloorPlan = function(id, name, url, floorLevel, bearing, bitmapHeight,
                         bitmapWidth, heightMeters, widthMeters, metersToPixels,
                         pixelsToMeters, bottomLeft, center, topLeft, topRight) {
  // Floor plan ID
  this.id = id;

  // Floor plan name
  this.name = name;

  // Floor plan url
  this.url = url;

  // Floor plan level
  this.floorLevel = floorLevel;

  // Floor plan bearing
  this.bearing = bearing;

  // Height of floor plan bitmap
  this.bitmapHeight = bitmapHeight;

  // Width of floor plan bitmap
  this.bitmapWidth = bitmapWidth;

  // Floor plan height in meters
  this.heightMeters = heightMeters;

  // Floor plan width in meters
  this.widthMeters = widthMeters;

  // Meters to pixels value
  this.metersToPixels = metersToPixels;

  // Pixels to meters value
  this.pixelsToMeters = pixelsToMeters;

  // Bottom left coordinates of the floor plan
  this.bottomLeft = bottomLeft;

  // Floor plan center coordinates
  this.center = center;

  // Top left coordinates of the floor plan
  this.topLeft = topLeft;

  // Top right coordinates of the floor plan
  this.topRight = topRight;

  // Point to coordinate function
  this.pointToCoordinate = function(x, y) {
    return CoordinateTransforms.pixToWgs(
      {
        scale: [this.widthMeters, this.heightMeters],
        location: [this.center[1], this.center[0]] ,
        rotation: (this.bearing * Math.PI) / 180,
        dimensions: [this.bitmapWidth, this.bitmapHeight]
      }, [x, y]);
  };

  // Coordinate to point function
  this.coordinateToPoint = function(lat, lon) {
    return CoordinateTransforms.wgsToPix(
      {
        scale: [this.widthMeters, this.heightMeters],
        location: [this.center[1], this.center[0]] ,
        rotation: (this.bearing * Math.PI) / 180,
        dimensions: [this.bitmapWidth, this.bitmapHeight]
      }, [lat, lon]
    );
  };
};

module.exports = FloorPlan;
