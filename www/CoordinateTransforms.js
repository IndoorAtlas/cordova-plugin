/*
 * Coordinate transforms
 */
var CoordinateTransforms = {
  boundingBoxToScalingFactor: function(bb) {
    var a = 6378137; // earth semimajor axis in meters
    var f = 1 / 298.257223563; // reciprocal flattening
    var b = a * (1 - f); // semi-minor axis

    var lat = bb.location[0];

    // Linearization
    var a2 = a * a;
    var b2 = b * b;
    var sinlat = Math.sin(Math.PI / 180 * lat);
    var coslat = Math.cos(Math.PI / 180 * lat);
    var tmp = Math.sqrt(a2 * coslat * coslat + b2 * sinlat * sinlat);

    // Set scaling factors
    var dxDlng = Math.PI / 180 * (a2 / tmp) * coslat;
    var dyDlat = Math.PI / 180 * (a2 * b2 / (tmp * tmp * tmp));

    return { dxDlng: dxDlng, dyDlat: dyDlat };
  },

  // Pixel coordinates to WGS coordinates
  pixToWgs: function(boundingBox, pix) {
    return this.relToWgs(boundingBox, this.pixToRel(boundingBox, pix));
  },

  // Pixel coordinates to relative coordinates
  pixToRel: function(boundingBox, pix) {
    return [
      (pix[0] / boundingBox.dimensions[0] - 0.5) * 2,
      (pix[1] / boundingBox.dimensions[1] - 0.5) * 2
    ];
  },

  // Relative coordinates to WGS coordinates
  relToWgs: function(boundingBox, relativeCoords) {
    return this.enuToWgs(boundingBox, this.relToEnu(boundingBox, relativeCoords));
  },

  // Relative coordinates to ENU coordinates
  relToEnu: function(boundingBox, relativeCoords) {
    // scale
    var e = boundingBox.scale[0] / 2 * relativeCoords[0];
    var n = -(boundingBox.scale[1] / 2 * relativeCoords[1]); // enu positive to north/up, rel positive down

    // rotate
    var eRot = (e * Math.cos(-boundingBox.rotation)) - (n * Math.sin(-boundingBox.rotation));
    var nRot = (e * Math.sin(-boundingBox.rotation)) + (n * Math.cos(-boundingBox.rotation));

    return [eRot, nRot];
  },

  // ENU coordinates to WGS coordinates
  enuToWgs: function(boundingBox, enuCoords) {
    var scale = this.boundingBoxToScalingFactor(boundingBox);

    return {
      latitude: enuCoords[1] / scale.dyDlat + boundingBox.location[0],
      longitude: enuCoords[0] / scale.dxDlng + boundingBox.location[1]
    };
  },

  // WGS coordinates to pixel coordinates
  wgsToPix: function(boundingBox, wgsCoords) {
    return this.relToPix(boundingBox, this.wgsToRel(boundingBox, wgsCoords));
  },

  // WGS coordinates to relative coordinates
  wgsToRel: function(boundingBox, wgsCoords) {
    return this.enuToRel(boundingBox, this.wgsToEnu(boundingBox, wgsCoords));
  },

  // WGS coordinates to ENU coordinates
  wgsToEnu: function(boundingBox, wgsCoords) {
    var scale = this.boundingBoxToScalingFactor(boundingBox);

    return [
      (wgsCoords[1] - boundingBox.location[1]) * scale.dxDlng,
      (wgsCoords[0] - boundingBox.location[0]) * scale.dyDlat
    ];
  },

  // ENU coordinates to relative coordinates
  enuToRel: function(boundingBox, enuCoords) {
    // rotate
    var eRot = (enuCoords[0] * Math.cos(boundingBox.rotation)) - (enuCoords[1] * Math.sin(boundingBox.rotation));
    var nRot = (enuCoords[0] * Math.sin(boundingBox.rotation)) + (enuCoords[1] * Math.cos(boundingBox.rotation));

    // scale
    var x = eRot / (boundingBox.scale[0] / 2);
    var y = -(nRot / (boundingBox.scale[1] / 2)); // enu positive to north/up, rel positive down

    return [x, y];
  },

  // Relative coordinates to pixel coordinates
  relToPix: function(boundingBox, relativeCoords) {
    return {
      x: relativeCoords[0] * (boundingBox.dimensions[0] / 2.0) + boundingBox.dimensions[0] / 2.0,
      y: relativeCoords[1] * (boundingBox.dimensions[1] / 2.0) + boundingBox.dimensions[1] / 2.0
    };
  }
};

module.exports = CoordinateTransforms;
