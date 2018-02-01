/**
 * Position error object
 *
 * @constructor
 * @param code
 * @param message
 */

var PositionError = function(code, message) {
  this.code = code || null;
  this.message = message || '';
};

PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;
PositionError.INVALID_ACCESS_TOKEN = 4;
PositionError.INITIALIZATION_ERROR = 5;
PositionError.FLOOR_PLAN_UNAVAILABLE = 6;
PositionError.UNSPECIFIED_ERROR = 7;
PositionError.FLOOR_PLAN_UNDEFINED = 8;
PositionError.INVALID_VALUE = 9;

module.exports = PositionError;
