// private helper variables, not in the global namespace
var statusMap = {};

/**
 * IndoorAtlas service status obtained with {@link #onStatusChanged}.
 */
var CurrentStatus = function(code, message) {
  /**
   * Status code
   * @example 2
   * @type {number}
   */
  this.code = code;

  /**
   * Name of the status, one of the statuses codes defined below
   * @example "AVAILABLE"
   * @type {string}
   */
  this.name = statusMap[code];

  /**
   * Error message optionally included in the status change
   * @type {string}
   */
  this.message = message;
};

/**
 * Unrecoverable error, e.g., wrong API keys
 */
CurrentStatus.OUT_OF_SERVICE = 0;

/**
 * Temporary network issue
 */
CurrentStatus.TEMPORARILY_UNAVAILABLE = 1;

/**
 * Location service running normally
 */
CurrentStatus.AVAILABLE = 2;

/**
 * Permission issue, e.g., missing bluetooth or location permission
 */
CurrentStatus.LIMITED = 10;

[
  'OUT_OF_SERVICE',
  'TEMPORARILY_UNAVAILABLE',
  'AVAILABLE',
  'LIMITED'
].forEach(function (statusName) {
  statusMap[CurrentStatus[statusName]] = statusName; // = status code
});

module.exports = CurrentStatus;
