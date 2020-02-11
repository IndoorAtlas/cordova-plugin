/**
 * POI, or Point Of Interest, is a special position inside a building
 */
var POI = function (data) {
  /**
   * Unique identifier of the POI
   * @type {string}
   */
  this.id = data.id;

  /**
   * Name of the POI
   * @type {string}
   * @example 'Reception desk'
   */
  this.name = data.name;

  /**
   * Floor number where the POI is located
   */
  this.floor = data.floor;

  /**
   * WGS84 latitude coordinate of the POI
   * @type {number}
   */
  this.latitude = data.latitude;

  /**
   * WGS84 longitude coordinate of the POI
   * @type {number}
   */
  this.longitude = data.longitude;

  /**
   * A JavaScript object parsed from the free-form JSON payload
   */
  this.payload = data.payload;

  /**
   * Convert POI to GeoJSON representation (see {@link https://tools.ietf.org/html/rfc7946}).
   * @return {object} The POI as a GeoJSON Point feature.
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
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
      }
    };
  };
};

/**
 * Convert a GeoJSON Point feature (see {@link https://tools.ietf.org/html/rfc7946}) to a POI.
 * @return {POI} Returns a {@link POI} object.
 */
POI.fromGeoJSON = function (geoJson) {
  return new POI({
    id: geoJson.id,
    name: geoJson.properties.name,
    floor: geoJson.properties.floor,
    latitude: geoJson.geometry.coordinates[1],
    longitude: geoJson.geometry.coordinates[0],
    payload: geoJson.properties.payload
  });
};

module.exports = POI;
