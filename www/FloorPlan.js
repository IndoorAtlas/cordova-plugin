var CoordinateTransforms = require('./CoordinateTransforms');
/**
 * A data object describing a floor plan.
 * Can be obtained with {@link #watchFloorPlan} or as the
 * {@link Position#floorPlan} member of the position returned by
 * {@link #watchPosition}.
 */
var FloorPlan = function(data) {
  /**
   * Floor plan ID
   * @type {string}
   * @example "5be07da6-6c8b-4fb8-b4a7-9b093fbb4dbb"
   */
  this.id = data.id;

  /**
   * Floor plan name
   * @type {string}
   * @example "Ground Floor"
   */
  this.name = data.name;

  /**
   * URL for bitmap resource
   * @example "https://example.com/d346ea8a-3d1d-44a3-9c8b-3d4fa440a779.png"
   * @type {string}
   */
  this.url = data.url;

  /**
   * The logical floor level of building as defined in the mapping phase
   * @type {number}
   * @example 2
   */
  this.floorLevel = data.floorLevel;

  /**
   * The bearing of left side of floor plan in degrees East of true North
   * @type {number}
   * @example 143
   */
  this.bearing = data.bearing;

  /**
   * Heigh of the floor plan image bitmap in pixels
   * @type {number}
   * @example 1024
   */
  this.bitmapHeight = data.bitmapHeight;

  /**
   * Width of the floor plan image bitmap in pixels
   * @type {number}
   * @example 2048
   */
  this.bitmapWidth = data.bitmapWidth;

  /**
   * Height of floor plan bitmap placed on the surface of Earth in meters
   * @type {number}
   * @example 25
   */
  this.heightMeters = data.heightMeters;

  /**
   * Width of floor plan bitmap placed on the surface of Earth in meters
   * @type {number}
   * @example 50
   */
  this.widthMeters = data.widthMeters;

  /**
   * Meters to pixels conversion factor Multiply distance in meters by this
   * factor to get distance in pixels.
   * @type {number}
   * @example 20.48
   */
  this.metersToPixels = data.metersToPixels;

  /**
   * Pixels to meters conversion factor. Multiply distance in pixels by this
   * factor to get distance in meter
   * @type {number}
   * @example 0.05
   */
  this.pixelsToMeters = data.pixelsToMeters;

  /**
   * WGS84 coordinates of the bottom left corner of the floor plan
   * placed on the surface of Earth. Represented as array in lon, lat sequence
   * @type {array}
   * @example [24.1234, 63.1234]
   */
  this.bottomLeft = data.bottomLeft;

  /**
   * WGS84 coordinates of the center of the floor plan
   * placed on the surface of Earth. Represented as array in lon, lat sequence
   * @type {array}
   * @example [24.1234, 63.1234]
   */
  this.center = data.center;

  /**
   * WGS84 coordinates of the top left corner of the floor plan
   * placed on the surface of Earth. Represented as array in lon, lat sequence
   * @type {array}
   * @example [24.1234, 63.1234]
   */
  this.topLeft = data.topLeft;

  /**
   * WGS84 coordinates of the top rigth corner of the floor plan
   * placed on the surface of Earth. Represented as array in lon, lat sequence
   * @type {array}
   * @example [24.1234, 63.1234]
   */
  this.topRight = data.topRight;

  /**
   * Converts given point to corresponding WGS coordinate.
   * Inverse of {@link #pointToCoordinate}.
   *
   * @param {number} x pixel x coordinate
   * @param {number} y pixel y coordinate
   * @return {object} WGS84 coordinates `{ latitude, longitude }`.
   * @example
   * floorPlan.pointToCoordinate(405, 185);
   * // returns { latitude: 63.1234, longitude: 24.1234 }
   */
  this.pointToCoordinate = function(x, y) {
    return CoordinateTransforms.pixToWgs(
      {
        scale: [this.widthMeters, this.heightMeters],
        location: [this.center[1], this.center[0]] ,
        rotation: (this.bearing * Math.PI) / 180,
        dimensions: [this.bitmapWidth, this.bitmapHeight]
      }, [x, y]);
  };

  /**
   * Converts given coordinate to corresponding point.
   * Inverse of {@link #coordinateToPoint}
   *
   * @param {number} lat latitude in degrees
   * @param {number} lon longitude in degrees
   * @return {object} pixel coordinates `{ x, y }`.
   * @example
   * floorPlan.pointToCoordinate(63.1234, 24.1234);
   * // returns { x: 405, y: 185 }
   */
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
