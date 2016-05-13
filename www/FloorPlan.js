
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
var FloorPlan = function(id,name,url,floorLevel,bearing,bitmapHeight,bitmapWidth,heightMeters,widthMeters,metersToPixels,pixelsToMeters,bottomLeft,center,topLeft,topRight) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.floorLevel = floorLevel;
    this.bearing = bearing;
    this.bitmapHeight = bitmapHeight;
    this.bitmapWidth=bitmapWidth;
    this.heightMeters = heightMeters;
    this.widthMeters = widthMeters;
    this.metersToPixels = metersToPixels;
    this.pixelsToMeters = pixelsToMeters;
    this.bottomLeft = bottomLeft;
    this.center = center;
    this.topLeft = topLeft;
    this.topRight = topRight;
};

module.exports = FloorPlan;
