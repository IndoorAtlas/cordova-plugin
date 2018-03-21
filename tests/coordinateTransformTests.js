var CoordinateTransforms = require('../www/CoordinateTransforms');
var expect = require('chai').expect;

var PRECISION_FOR_COORDINATES = 6;

var floorPlan = {
  "name":"Floor 4",
  "floorLevel":4,
  "bearing":177.21051025390625,
  "bitmapHeight":3307,
  "bitmapWidth":2339,
  "heightMeters":42.54764175415039,
  "widthMeters":30.09341812133789,
  "metersToPixels":77.72463989257812,
  "pixelsToMeters":0.012865932658314705,
  "bottomLeft":[24.9459358245201,60.17076602968721],
  "center":[24.94568377884345,60.170568730967204],
  "topLeft":[24.9459731869549,60.17038459999831],
  "topRight":[24.9454317331668,60.17037143224721]
}

var testData = {
  test1: {
    point: {
      x: 0,
      y: 0
    },
    coordinates: {
      lat: 60.17038459999831,
      lon: 24.9459731869549
    }
  },
  test2: {
    point: {
      x: 10,
      y: 10
    },
    coordinates: {
      lat: 60.170385697102745,
      lon: 24.94597075908071
    }
  },
  test3: {
    point: {
      x: 100,
      y: 200
    },
    coordinates: {
      lat: 60.170407105052,
      lon: 24.945947778414514
    }
  },
  test4: {
    point: {
      x: 1000,
      y: 1000
    },
    coordinates: {
      lat: 60.170494310441825,
      lon: 24.945730399535538
    }
  },
  test5: {
    point: {
      x: 0,
      y: 200
    },
    coordinates: {
      lat: 60.17040766801699,
      lon: 24.945970927357997
    }
  }
};

var boundingBox = {
  scale: [floorPlan.widthMeters, floorPlan.heightMeters],
  location: [floorPlan.center[1], floorPlan.center[0]] ,
  rotation: (floorPlan.bearing * Math.PI) / 180,
  dimensions: [floorPlan.bitmapWidth, floorPlan.bitmapHeight]
};

describe('pointToCoordinate', function() {
  it('should transform pixel point to WGS coordinates', function() {

    comparePointToCoordinate(boundingBox, testData.test1);
    comparePointToCoordinate(boundingBox, testData.test2);
    comparePointToCoordinate(boundingBox, testData.test3);
    comparePointToCoordinate(boundingBox, testData.test4);
    comparePointToCoordinate(boundingBox, testData.test5);
  });
});

describe('coordinateToPoint', function() {
  it('should transform WGS coordinates to pixel point', function() {

    compareCoordinateToPoint(boundingBox, testData.test1);
    compareCoordinateToPoint(boundingBox, testData.test2);
    compareCoordinateToPoint(boundingBox, testData.test3);
    compareCoordinateToPoint(boundingBox, testData.test4);
    compareCoordinateToPoint(boundingBox, testData.test5);
  });
});

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
};

/**
 * Compares that given point returns correct coordinate
 * @param boundingBox 
 * @param data 
 */
function comparePointToCoordinate(boundingBox, data) {
  var x = data.point.x;
  var y = data.point.y;

  var coords = CoordinateTransforms.pixToWgs(boundingBox, [x, y]);

  expect(precisionRound(coords.latitude, PRECISION_FOR_COORDINATES)).to.be.equal(precisionRound(data.coordinates.lat, PRECISION_FOR_COORDINATES));
  expect(precisionRound(coords.longitude, PRECISION_FOR_COORDINATES)).to.be.equal(precisionRound(data.coordinates.lon, PRECISION_FOR_COORDINATES));
};

/**
 * Compares that given coordinate returns correct pixel point
 * @param boundingBox 
 * @param data 
 */
function compareCoordinateToPoint(boundingBox, data) {
  var lat = data.coordinates.lat;
  var lon = data.coordinates.lon;

  var point = CoordinateTransforms.wgsToPix(boundingBox, [lat, lon]);
  
  expect(Math.round(point.x)).to.be.equal(Math.round(data.point.x));
  expect(Math.round(point.y)).to.be.equal(Math.round(data.point.y));
};