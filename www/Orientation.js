function rad2deg(x) {
  return x / Math.PI * 180.0;
}

/**
 * Describes the heading and orientation of the device.
 * Obtained with {@link #watchOrientation}
 */
var Orientation = function(data) {
  // ported from OrientationActivity.java in android-sdk-examples
  var qw = data.w;
  var qx = data.x;
  var qy = data.y;
  var qz = data.z;

  // Compute Euler angles
  var pitch = Math.atan2(2.0 * (qw * qx + qy * qz), 1.0 - 2.0 * (qx * qx + qy * qy));
  var roll =  Math.asin(2.0 * (qw * qy - qz * qx));
  var yaw = -Math.atan2(2.0 * (qw * qz + qx * qy), 1.0 - 2.0 * (qy * qy + qz * qz));

  /**
   * Heading of the device, i.e., the direction where the screen y-axis points
   * to, specified in degrees counting clockwise relative to the true north.
   * Also known as _yaw_.
   *
   * @type {number}
   */
  this.trueHeading = (rad2deg(yaw) + 360) % 360;

  /**
   * Roll angle of the device in degress
   * @type {number}
   */
  this.roll = rad2deg(roll);

  /**
   * Pitch angle of the device in degrees
   * @type {number}
   */
  this.pitch = rad2deg(pitch);

  /**
   * Orientation quaternion `{ w, x, y, z}`
   * @type {object}
   */
  this.quaternion = {
    w: qw,
    x: qx,
    y: qy,
    z: qz
  };
};

module.exports = Orientation;
