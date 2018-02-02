/**
 * IA current status object
 *
 * @constructor
 * @param code
 * @param message
 */

var CurrentStatus = function(code, message) {
  this.code = code;
  this.message = message;
};

CurrentStatus.STATUS_OUT_OF_SERVICE = 0;
CurrentStatus.STATUS_TEMPORARILY_UNAVAILABLE = 1;
CurrentStatus.STATUS_AVAILABLE = 2;
CurrentStatus.STATUS_LIMITED = 10;

module.exports = CurrentStatus;
