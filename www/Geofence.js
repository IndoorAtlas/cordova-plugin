/**
 * A geofence describes a region of interest. Entering or exiting geofences
 * will trigger SDK events caught by {@link #watchGeofences}. The geofences
 * contained in a {@link Venue} are sent together with the venue (see {@link #watchVenue} and {@link #watchPosition}).
 */
var Geofence = function(data) {
  /**
   * Unique identifier of the geofence
   * @type {string}
   * @example '12345678-90ab-cdef-1234-567890abcdef'
   */
  this.id = data.id;

  /**
   * Name of the geofence
   * @type {string}
   * @example 'Meeting room A101'
   */
  this.name = data.name;

  /**
   * Floor number of the geofence
   * @type {number}
   */
  this.floor = data.floor;

  /**
   * WGS84 coordinates of the vertices of the geofence polygon
   * @type {object[]}
   * @example
   * [
   *   { latitude: 65.01, longitude: 25.50 },
   *   { latitude: 65.02, longitude: 25.51 },
   *   { latitude: 65.01, longitude: 25.52 },
   *   { latitude: 65.01, longitude: 25.50 },
   * ]
   */
  this.coordinates = data.coordinates;

  /**
   * A JavaScript object parsed from the free-form JSON payload
   */
  this.payload = data.payload;

  /**
   * Convert geofence to GeoJSON representation (see {@link https://tools.ietf.org/html/rfc7946}).
   * @return {object} The geofence as a GeoJSON Polygon feature.
   */
  this.toGeoJSON = function () {
    return {
      type: 'Feature',
      id: this.id,
      properties: {
        name: this.name,
        floor: this.floor,
        payload: this.payload
      },
      geometry: {
        type: 'Polygon',
        coordinates: [this.coordinates.map(function (coord) {
          return [coord.longitude, coord.latitude];
        })]
      }
    };
  };
};

/**
 * Convert a GeoJSON Polygon (see {@link https://tools.ietf.org/html/rfc7946}) to a geofence.
 * @return {Geofence} Returns a {@link Geofence} object.
 */
Geofence.fromGeoJSON = function (geoJson) {
  return new Geofence({
    id: geoJson.id,
    name: geoJson.properties.name,
    floor: geoJson.properties.floor,
    coordinates: geoJson.geometry.coordinates[0].map(function (coord) {
      return {
        latitude: coord[1],
        longitude: coord[0]
      };
    }),
    payload: geoJson.properties.payload || {}
  });
};

module.exports = Geofence;
