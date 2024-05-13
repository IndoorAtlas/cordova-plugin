/**
 * IBeacon
 */
var IBeacon = function(beacon) {
    /**
     * UUID
     * @type {string}
     */
    this.uuid = beacon.uuid;
    /**
     * Major
     * @type {number}
     */
    this.major = beacon.major;
    /**
     * Minor
     * @type {number}
     */
    this.minor = beacon.minor;
    /**
     * RSSI - the detected signal level in dBm
     * @type {number}
     */
    this.rssi = beacon.rssi;
};

/**
 * Wifi
 */
var Wifi = function(wifi) {
    /**
     * BSSID
     * @type {string}
     */
    this.bssid = wifi.bssid;
    /**
     * RSSI - the detected signal level in dBm
     * @type {number}
     */
    this.rssi = wifi.rssi;
};

/**
 * Error
 */
var RadioScanError = function(error) {
    /**
     * Error description
     * @type {string}
     */
    this.description = error.description;
    /**
     * Error details (optional). Platform specific error details for failed scan (if available).
     * Examples:
     * iOS: `{ "region": {"uuid": "e913d904-8b75-4d3c-b3e0-b6e98feae1c7", "major": 1, "minor": 2} }`
     * Android: `{ "errorCode": 2 }`
     * @type {object}
     */
    this.details = error.details;
};

module.exports = { IBeacon, Wifi, RadioScanError };
