/* jshint jasmine: true */
/* global WinJS, device */

exports.defineAutoTests = function () {

  var fail = function (done, context, message) {
    // prevents done() to be called several times
    if (context) {
      if (context.done) return;
      context.done = true;
    }

    if (message) {
      expect(false).toBe(true, message);
    } else {
      expect(false).toBe(true);
    }

    // watchPosition could call its callback sync (before returning the value)
    // so we invoke done async to make sure we know watcher id to .clear in afterEach
    setTimeout(function () {
      done();
    });
  };

  var succeed = function (done, context) {
    // prevents done() to be called several times
    if (context) {
      if (context.done) return;
      context.done = true;
    }

    expect(true).toBe(true);

    // watchPosition could call its callback sync (before returning the value)
    // so we invoke done async to make sure we know watcher id to .clear in afterEach
    setTimeout(function () {
      done();
    });
  };
  var activateIndoorAtlas = function () {
    var _config = {};//{ key: '<<YOUR KEY>>', secret: '<<YOUR SECRET>>' };

    var win = function (p) {
    };
    var fail = function (e) {
      console.log(e.message);
    };

    IndoorAtlas.initialize(win, fail, _config);
  };
  activateIndoorAtlas();

  // On Windows, some tests prompt user for permission to use geolocation and interrupt autotests run
  //    var isWindowsStore = (cordova.platformId == "windows8") || (cordova.platformId == "windows" && !WinJS.Utilities.isPhone);
  //    var majorDeviceVersion = null;
  //    var versionRegex = /(\d)\..+/.exec(device.version);
  //    if (versionRegex !== null) {
  //        majorDeviceVersion = Number(versionRegex[1]);
  //    }
  // Starting from Android 6.0 there are confirmation dialog which prevents us from running auto tests in silent mode (user interaction needed)
  // Also, Android emulator doesn't provide geo fix without manual interactions or mocks
  var skipAndroid = false;//cordova.platformId == "android" && (device.isVirtual || majorDeviceVersion >= 6);
  var isIOSSim = false; // if iOS simulator does not have a location set, it will fail.

  describe('Location (IndoorAtlas)', function () {

    it("Test.spec.1 Should exist", function () {
      expect(IndoorAtlas).toBeDefined();
    });

    it("Test.spec.2 Should contain a getCurrentPosition function", function () {
      expect(typeof IndoorAtlas.getCurrentPosition).toBeDefined();
      expect(typeof IndoorAtlas.getCurrentPosition == 'function').toBe(true);
    });

    it("Test.spec.3 Should contain a watchPosition function", function () {
      expect(typeof IndoorAtlas.watchPosition).toBeDefined();
      expect(typeof IndoorAtlas.watchPosition == 'function').toBe(true);
    });

    it("Test.spec.4 Should contain a clearWatch function", function () {
      expect(typeof IndoorAtlas.clearWatch).toBeDefined();
      expect(typeof IndoorAtlas.clearWatch == 'function').toBe(true);
    });

    it("Test.spec.5 Should contain a fetchFloorPlanWithId function", function () {
      expect(typeof IndoorAtlas.fetchFloorPlanWithId).toBeDefined();
      expect(typeof IndoorAtlas.fetchFloorPlanWithId == 'function').toBe(true);
    });

    it("Test.spec.6 Should contain a setPosition function", function () {
      expect(typeof IndoorAtlas.setPosition).toBeDefined();
      expect(typeof IndoorAtlas.setPosition == 'function').toBe(true);
    });

    it("Test.spec.7 Should contain a watchRegion function", function () {
      expect(typeof IndoorAtlas.watchRegion).toBeDefined();
      expect(typeof IndoorAtlas.watchRegion == 'function').toBe(true);
    });

    it("Test.spec.8 Should contain an initialize function", function () {
      expect(typeof IndoorAtlas.initialize).toBeDefined();
      expect(typeof IndoorAtlas.initialize == 'function').toBe(true);
    });

    it("Test.spec.9 Should contain a clearRegionWatch function", function () {
      expect(typeof IndoorAtlas.clearRegionWatch).toBeDefined();
      expect(typeof IndoorAtlas.clearRegionWatch == 'function').toBe(true);
    });

    it("Test.spec.10 Should contain a coordinateToPoint function", function () {
      expect(typeof IndoorAtlas.coordinateToPoint).toBeDefined();
      expect(typeof IndoorAtlas.coordinateToPoint == 'function').toBe(true);
    });

    it("Test.spec.11 Should contain a pointToCoordinate function", function () {
      expect(typeof IndoorAtlas.pointToCoordinate).toBeDefined();
      expect(typeof IndoorAtlas.pointToCoordinate == 'function').toBe(true);
    });

    it("Test.spec.12 Should contain a setDistanceFilter function", function () {
      expect(typeof IndoorAtlas.setDistanceFilter).toBeDefined();
      expect(typeof IndoorAtlas.setDistanceFilter == 'function').toBe(true);
    });
  });


  describe('getCurrentPosition Method', function () {

    describe('Error Callback', function () {

      it("Test.spec.13 Should be called if we set timeout to 0", function (done) {
        if (skipAndroid) {
          pending();
        }

        IndoorAtlas.getCurrentPosition(
          fail.bind(null, done),
          succeed.bind(null, done),
          {
            timeout: 0
          });
        });

        it("Test.spec.14 On failure should return PositionError object with error code constants", function (done) {
          if (skipAndroid) {
            pending();
          }

          IndoorAtlas.getCurrentPosition(
            fail.bind(this, done),
            function (gpsError) {
              expect(gpsError.code).toBe(PositionError.TIMEOUT);
              done();
            },
            {
              timeout: 0
            });
          });
        });

        describe('Success Callback', function () {

          it("Test.spec.15 Should be called with a Position object", function (done) {
            if (skipAndroid) {
              pending();
            }

            IndoorAtlas.getCurrentPosition(function (p) {
              expect(p.coords).toBeDefined();
              expect(p.coords.latitude).toBeDefined();
              expect(p.coords.longitude).toBeDefined();
              expect(p.coords.altitude).toBeDefined();
              expect(p.coords.accuracy).toBeDefined();
              expect(p.coords.altitudeAccuracy).toBeDefined();
              expect(p.coords.heading).toBeDefined();
              expect(p.coords.speed).toBeDefined();
              expect(p.coords.floor).toBeDefined();

              expect(p.timestamp).toBeDefined();

              expect(p.region).toBeDefined();
              expect(p.region.regionType).toBeDefined();
              expect(p.region.transitionType).toBeDefined();
              expect(p.region.timestamp).toBeDefined();
              done();
            }, function (err) {
              if (err.message && err.message.indexOf('kCLErrorDomain') > -1) {
                console.log("Error: Location not set in simulator, tests will fail.");
                expect(true).toBe(true);
                isIOSSim = true;
                done();
              }
              else {
                fail(done);
              }
            });
          }, 25000); // first geolocation call can take several seconds on some devices
        });
      });

      describe('watchPosition Method', function () {

        beforeEach(function (done) {
          // This timeout is set to lessen the load on platform's geolocation services
          // which were causing occasional test failures
          setTimeout(function () {
            done();
          }, 100);
        });

        describe('Error Callback', function () {

          var errorWatch = null;
          afterEach(function () {
            IndoorAtlas.clearWatch(errorWatch);
          });

          it("Test.spec.16 Should be called if we set timeout to 0", function (done) {
            if (skipAndroid) {
              pending();
            }

            var context = this;
            errorWatch = IndoorAtlas.watchPosition(
              fail.bind(null, done, context, 'Unexpected win'),
              succeed.bind(null, done, context),
              {
                timeout: 0
              });
            });

            it("Test.spec.17 On failure should return PositionError object with error code constants", function (done) {
              if (skipAndroid) {
                pending();
              }

              var context = this;
              errorWatch = IndoorAtlas.watchPosition(
                fail.bind(this, done, context, 'Unexpected win'),
                function (gpsError) {
                  if (context.done) return;
                  context.done = true;
                  expect(gpsError.code).toBe(PositionError.TIMEOUT);
                  done();
                },
                {
                  timeout: 0
                });
              });
            });

            describe('Success Callback', function () {
              var successWatch = null;
              afterEach(function () {
                IndoorAtlas.clearWatch(successWatch);
              });

              it("Test.spec.18 Should be called with a Position object", function (done) {
                if (skipAndroid || isIOSSim) {
                  pending();
                }

                var context = this;
                successWatch = IndoorAtlas.watchPosition(
                  function (p) {
                    // prevents done() to be called several times
                    if (context.done) return;
                    context.done = true;

                    expect(p.coords).toBeDefined();
                    expect(p.coords.latitude).toBeDefined();
                    expect(p.coords.longitude).toBeDefined();
                    expect(p.coords.altitude).toBeDefined();
                    expect(p.coords.accuracy).toBeDefined();
                    expect(p.coords.altitudeAccuracy).toBeDefined();
                    expect(p.coords.heading).toBeDefined();
                    expect(p.coords.speed).toBeDefined();
                    expect(p.coords.floor).toBeDefined();

                    expect(p.timestamp).toBeDefined();

                    expect(p.region).toBeDefined();
                    expect(p.region.regionType).toBeDefined();
                    expect(p.region.transitionType).toBeDefined();
                    expect(p.region.timestamp).toBeDefined();

                    // callback could be called sync so we invoke done async to make sure we know watcher id to .clear in afterEach
                    setTimeout(function () {
                      done();
                    });
                  },
                  function (err) {
                    if (err.message) {
                      console.log("Error: Location not set in simulator, tests will fail.");
                      expect(true).toBe(false);
                      isIOSSim = true;
                      done();
                    }
                    else {
                      fail(done);
                    }
                  });
                }, 25000);
              });
            });

            describe('fetchFloorPlanWithID Method', function () {
              describe('Error Callback', function () {

                it("Test.spec.19 Failed as Wrong FloorPlan id Pass", function (done) {
                  if (skipAndroid) {
                    pending();
                  }

                  IndoorAtlas.fetchFloorPlanWithId("Wrongid", fail.bind(null, done),
                  succeed.bind(null, done));
                }, 25000);
              });

              describe('Success Callback', function () {
                it("Test.spec.20 Should be called with a fetchFloorPlan object", function (done) {
                  if (skipAndroid) {
                    pending();
                  }

                  IndoorAtlas.fetchFloorPlanWithId("b95c61ff-bdf5-46dd-80ee-3fa322374d62", function (p) {
                    expect(p.url).toBeDefined();
                    expect(p.id).toBeDefined();
                    expect(p.name).toBeDefined();
                    expect(p.floorLevel).toBeDefined();
                    expect(p.bearing).toBeDefined();
                    expect(p.bitmapHeight).toBeDefined();
                    expect(p.bitmapWidth).toBeDefined();
                    expect(p.heightMeters).toBeDefined();
                    expect(p.widthMeters).toBeDefined();
                    expect(p.metersToPixels).toBeDefined();
                    expect(p.pixelsToMeters).toBeDefined();
                    expect(p.bottomLeft).toBeDefined();
                    expect(p.center).toBeDefined();
                    expect(p.topLeft).toBeDefined();
                    expect(p.topRight).toBeDefined();
                    done();
                  }, function (err) {
                    if (err.message) {
                      console.log("Error: Location not set in simulator, tests will fail.");
                      expect(true).toBe(false);
                      isIOSSim = true;
                      done();
                    }
                    else {
                      fail(done);
                    }
                  });
                }, 50000);
                it("Test.spec.21 Should be called error object as wrong floor plan pass ", function (done) {
                  if (skipAndroid) {
                    pending();
                  }

                  IndoorAtlas.fetchFloorPlanWithId("Wrongid", fail.bind(null, done)
                  , function (err) {
                    expect(err.message).toBeDefined();
                    done();
                  });
                }, 50000);
              });
            });

            describe('setPosition Method', function () {
              describe('Success Callback', function () {

                it("Test.spec.22 Should be called to setPosition", function (done) {
                  if (skipAndroid) {
                    pending();
                  }
                  IndoorAtlas.setPosition(function(msg) {
                    expect(msg.message).toBeDefined();
                    done();
                  }, succeed.bind(null, done),
                  {regionId:'00000001-0002-0003-0004-000000000005', coordinates:[37.784013,-122.406872]}
                );
              }, 50000);
            });
          });

          describe('coordinateToPoint Method', function () {
            describe('Error Callback', function () {

              it("Test.spec.23 Error callback succeeded", function (done) {
                if (skipAndroid) {
                  pending();
                }

                IndoorAtlas.coordinateToPoint({latitude:23, longitude: 23},'WrongID', fail.bind(null, done),
                succeed.bind(null, done));
              }, 25000);
            });

            describe('Success Callback', function () {
              it("Test.spec.24 Should be called with a point object", function (done) {
                if (skipAndroid) {
                  pending();
                }

                IndoorAtlas.coordinateToPoint({latitude: 65.060848804763, longitude: 25.4410770535469}, "b95c61ff-bdf5-46dd-80ee-3fa322374d62", function (p) {
                  expect(p.x).toBeDefined();
                  expect(p.y).toBeDefined();
                  done();
                }, function (err) {
                  if (err.message) {
                    console.log("Error: Location not set in simulator, tests will fail.");
                    expect(true).toBe(false);
                    isIOSSim = true;
                    done();
                  }
                  else {
                    fail(done);
                  }
                });
              }, 50000);
              it("Test.spec.25 Should be called error object because of failed call ", function (done) {
                if (skipAndroid) {
                  pending();
                }

                IndoorAtlas.coordinateToPoint({latitude: 65.060848804763, longitude: 25.4410770535469}, "WrongID", fail.bind(null, done)
                , function (err) {
                  expect(err.message).toBeDefined();
                  done();
                });
              }, 50000);
            });
          });

          describe('pointToCoordinate Method', function () {
            describe('Error Callback', function () {

              it("Test.spec.26 Error callback succeeded", function (done) {
                if (skipAndroid) {
                  pending();
                }

                IndoorAtlas.pointToCoordinate({x: 0, y: 0}, 'WrongID', fail.bind(null, done),
                succeed.bind(null, done));
              }, 25000);
            });

            describe('Success Callback', function () {
              it("Test.spec.27 Should be called with a coordinates object", function (done) {
                if (skipAndroid) {
                  pending();
                }

                IndoorAtlas.pointToCoordinate({x: 0, y: 0}, 'df0e164f-e207-4ae7-bfd0-7ede91c5a685', function (p) {
                  expect(p.latitude).toBeDefined();
                  expect(p.longitude).toBeDefined();
                  done();
                }, function (err) {
                  if (err.message) {
                    console.log("Error: Location not set in simulator, tests will fail.");
                    expect(true).toBe(false);
                    isIOSSim = true;
                    done();
                  }
                  else {
                    fail(done);
                  }
                });
              }, 50000);
              it("Test.spec.28 Should be called error object because of failed call", function (done) {
                if (skipAndroid) {
                  pending();
                }

                IndoorAtlas.pointToCoordinate({x: 0, y: 0}, 'WrongID', fail.bind(null, done)
                , function (err) {
                  expect(err.message).toBeDefined();
                  done();
                });
              }, 50000);
            });
          });

          describe('setDistanceFilter Method', function () {
            describe('Success Callback', function () {

              it("Test.spec.29 Should be called to setDistanceFilter", function (done) {
                if (skipAndroid) {
                  pending();
                }
                IndoorAtlas.setDistanceFilter(function(msg) {
                  expect(msg.message).toBeDefined();
                  done();
                }, function(err) {alert(err);},
                {distance: 5}
              );
            }, 50000);
          });
        });


        //This Test behave abnormally in auto mode please follow manual test for same
        //        describe('watchRegion method', function () {
        //
        //            beforeEach(function (done) {
        //                // This timeout is set to lessen the load on platform's geolocation services
        //                // which were causing occasional test failures
        //                setTimeout(function () {
        //                    done();
        //                }, 100);
        //            });
        //
        //            describe('success callback', function () {
        //
        //                var successWatch = null;
        //                afterEach(function () {
        //                    IndoorAtlas.clearRegionWatch(successWatch);
        //                });
        //
        //                it("test.spec.11 should be called with a Position object", function (done) {
        //                    if (skipAndroid || isIOSSim) {
        //                        pending();
        //                    }
        //
        //                    var context = this;
        //                    successWatch = IndoorAtlas.watchRegion(
        //                                                           function (p) {
        //                                                               // prevents done() to be called several times
        //                                                               if (context.done) return;
        //                                                               context.done = true;
        //                                                               expect(p.regionId).toBeDefined();
        //                                                               expect(p.timestamp).toBeDefined();
        //                                                               expect(p.transitionType).toBe(1);
        //                                                               // callback could be called sync so we invoke done async to make sure we know watcher id to .clear in afterEach
        //                                                               setTimeout(function () {
        //                                                                   done();
        //                                                               });
        //                                                           },
        //                                                           function (p) {
        //                                                               // prevents done() to be called several times
        //                                                               if (context.done) return;
        //                                                               context.done = true;
        //                                                               expect(p.regionId).toBeDefined();
        //                                                               expect(p.timestamp).toBeDefined();
        //                                                               expect(p.transitionType).toBe(2);
        //                                                               // callback could be called sync so we invoke done async to make sure we know watcher id to .clear in afterEach
        //                                                               setTimeout(function () {
        //                                                                   done();
        //                                                               });
        //                                                           },
        //                                                           fail.bind(null, done, context, 'Unexpected fail callback'));
        //                    expect(successWatch).toBeDefined();
        //                }, 40000); // first region call can take several seconds on some devices
        //
        //            });
        //
        //        });




      };

      /******************************************************************************/
      /******************************************************************************/
      /******************************************************************************/

      exports.defineManualTests = function (contentEl, createActionButton) {

        var watchLocationId = null;
        var watchRegionId = null;
        /**
        * Set location status
        */
        function setLocationStatus(status) {
          document.getElementById('location_status').innerHTML = status;
        }
        function setLocationDetails(p) {
          var date = (new Date(p.timestamp));
          document.getElementById('latitude').innerHTML = p.coords.latitude;
          document.getElementById('longitude').innerHTML = p.coords.longitude;
          document.getElementById('altitude').innerHTML = p.coords.altitude;
          document.getElementById('accuracy').innerHTML = p.coords.accuracy;
          document.getElementById('heading').innerHTML = p.coords.heading;
          document.getElementById('speed').innerHTML = p.coords.speed;
          document.getElementById('region').innerHTML = p.region.regionId;
          document.getElementById('floor').innerHTML = p.coords.floor;
          document.getElementById('timestamp').innerHTML = date.toDateString() + " " + date.toTimeString();
        }
        function setRegionDetails(p) {
          var date = (new Date(p.timestamp));
          document.getElementById('transitiontype').innerHTML = p.transitionType;
          document.getElementById('floorid').innerHTML = p.regionId;
          document.getElementById('regiontype').innerHTML = p.regionType;
          document.getElementById('timestamp1').innerHTML = date.toDateString() + " " + date.toTimeString();
        }
        function setRegionStatus(status) {
          document.getElementById('region_status').innerHTML = status;
        }

        function setFloorPlanDetails(p) {
          document.getElementById('fpid').innerHTML = p.id;
          document.getElementById('fpname').innerHTML = p.name;
          document.getElementById('fpurl').innerHTML = "<a href='" + p.url + "' target='_blank'> link</a>";
          document.getElementById('fpfloorLevel').innerHTML = p.floorLevel;
          document.getElementById('fpfloorLevel').innerHTML = p.floorLevel;
          document.getElementById('fpbearing').innerHTML = p.bearing;
          document.getElementById('fpfloorLevel').innerHTML = p.floorLevel;
          document.getElementById('fpbitmapsize').innerHTML = p.bitmapWidth + " x " + p.bitmapHeight;
          document.getElementById('fpmetersToPixels').innerHTML = p.metersToPixels;
          document.getElementById('fppixelsToMeters').innerHTML = p.pixelsToMeters;
          document.getElementById('fpbottomLeft').innerHTML = p.bottomLeft;
          document.getElementById('fpcenter').innerHTML = p.center;
          document.getElementById('fptopLeft').innerHTML = p.topLeft;
          document.getElementById('fptopRight').innerHTML = p.topRight;
        }
        function setFloorPlanStatus(status) {
          document.getElementById('fp_status').innerHTML = status;
        }

        var activateIndoorAtlas = function () {
          var _config = {};//{ key: '<<YOUR KEY>>', secret: '<<YOUR SECRET>>' };
          var win = function (p) {

          };
          var fail = function (e) {
            console.log(e.message);
            setLocationStatus("Invalid Key");
          };
          IndoorAtlas.initialize(win, fail, _config);
        }
        activateIndoorAtlas();
        /**
        * Stop watching the location
        */
        function stopLocation() {
          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }
          setLocationStatus("Stopped");
          if (watchLocationId) {
            geo.clearWatch(watchLocationId);
            watchLocationId = null;
          }
        }

        /**
        * Start watching location
        */
        var watchLocation = function () {
          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }

          // Success callback
          var success = function (p) {
            setLocationDetails(p);
          };

          // Fail callback
          var fail = function (e) {
            console.log("watchLocation fail callback with error code " + e);
            stopLocation(geo);
          };

          // Get location
          watchLocationId = geo.watchPosition(success, fail, { enableHighAccuracy: true });
          setLocationStatus("Running");
        };

        /**
        * Get current location
        */
        var getLocation = function (opts) {

          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }

          // Stop location if running
          stopLocation(geo);

          // Success callback
          var success = function (p) {
            setLocationDetails(p);
            setLocationStatus("Done");
          };

          // Fail callback
          var fail = function (e) {
            console.log("getLocation fail callback with error code " + e.code);
            setLocationStatus("Error: " + e.code);
          };

          setLocationStatus("Retrieving location...");

          // Get location
          geo.getCurrentPosition(success, fail, opts || { enableHighAccuracy: true }); //, {timeout: 10000});
        };

        var watchRegion = function () {
          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }

          // Success callback
          var onEnterRegion = function (p) {
            setRegionDetails(p);
            setRegionStatus("Running-Entered");
          };
          var onExitRegion = function (p) {
            setRegionDetails(p);
            setRegionStatus("Running-Exited");
          };

          // Fail callback
          var fail = function (e) {
            console.log("watchRegion fail callback with error code " + e);
            stopRegion(geo);
          };

          // Get location
          watchRegionId = geo.watchRegion(onEnterRegion, onExitRegion, fail);
          setRegionStatus("Running");
        };
        var stopRegion = function () {
          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }
          setRegionStatus("Stopped");
          if (watchRegionId) {
            geo.clearRegionWatch(watchRegionId);
            watchRegionId = null;
          }
        };
        var setNewPosition = function (options) {
          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }
          // Success callback
          var success = function (p) {
            setLocationStatus("New Position Updated");
            alert("Calling 'get Locatation'  expected region id = b95c61ff-bdf5-46dd-80ee-3fa322374d62");
            getLocation();
          };

          // Fail callback
          var fail = function (e) {
            console.log("getLocation fail callback with error code " + e.code);
            setLocationStatus("Error: " + e.code);
          };

          setLocationStatus("Setting New Position");
          //Format {regionId:'b95c61ff-bdf5-46dd-80ee-3fa322374d62', coordinates:[37.784013,-122.406872]}
          geo.setPosition(success, fail, options);
        };

        var floorPlanWithid = function (fpid) {
          var geo = IndoorAtlas;
          if (!geo) {
            alert('IndoorAtlas object is missing.');
            return;
          }
          // Success callback
          var success = function (p) {
            setFloorPlanStatus("Sucessfull");
            setFloorPlanDetails(p);
          };

          // Fail callback
          var fail = function (e) {
            console.log("getLocation fail callback with error code " + e.code);
            setFloorPlanStatus("Error: " + e.code);
          };

          setFloorPlanStatus("Fetching FloorPlan");

          geo.fetchFloorPlanWithId(fpid, success, fail);
        };

        /******************************************************************************/

        var location_div = '<div id="info">' +
        '<b>Status:</b> <span id="location_status">Stopped</span>' +
        '<table width="100%">',
        latitude = '<tr>' +
        '<td><b>Latitude:</b></td>' +
        '<td id="latitude">&nbsp;</td>' +
        '</tr>',
        longitude = '<tr>' +
        '<td><b>Longitude:</b></td>' +
        '<td id="longitude">&nbsp;</td>' +
        '</tr>',
        altitude = '<tr>' +
        '<td><b>Altitude:</b></td>' +
        '<td id="altitude">&nbsp;</td>' +
        '</tr>',
        accuracy = '<tr>' +
        '<td><b>Accuracy:</b></td>' +
        '<td id="accuracy">&nbsp;</td>' +
        '</tr>',
        heading = '<tr>' +
        '<td><b>Heading:</b></td>' +
        '<td id="heading">&nbsp;</td>' +
        '</tr>',
        speed = '<tr>' +
        '<td><b>Speed:</b></td>' +
        '<td id="speed">&nbsp;</td>' +
        '</tr>',
        altitude_accuracy = '<tr>' +
        '<td><b>Altitude Accuracy:</b></td>' +
        '<td id="altitude_accuracy">&nbsp;</td>' +
        '</tr>',
        region = '<tr>' +
        '<td><b>Region:</b></td>' +
        '<td id="region">&nbsp;</td>' +
        '</tr>',
        floornumber = '<tr>' +
        '<td><b>Floor:</b></td>' +
        '<td id="floor">&nbsp;</td>' +
        '</tr>',
        time = '<tr>' +
        '<td><b>Time:</b></td>' +
        '<td id="timestamp">&nbsp;</td>' +
        '</tr>' +
        '</table>' +
        '</div>',
        region_div = '<div id="info">' +
        '<b>Status:</b> <span id="region_status">Stopped</span>' +
        '<table width="100%">' +
        '<tr>' +
        '<td><b>Region:</b></td>' +
        '<td id="floorid">&nbsp;</td>' +
        '</tr>' +
        '<tr>' +
        '<td><b>Region Type:</b></td>' +
        '<td id="regiontype">&nbsp;</td>' +
        '</tr>' +
        '<tr>' +
        '<td><b>Transition Type:</b></td>' +
        '<td id="transitiontype">&nbsp;</td>' +
        '</tr>' +
        '<tr>' +
        '<td><b>Time:</b></td>' +
        '<td id="timestamp1">&nbsp;</td>' +
        '</tr>' +
        '</table>' +
        '</div>',

        floorplan_div = '<div id="info">' +
        '<b>Status:</b> <span id="fp_status">Not Running</span>' +
        '<table width="100%">' +
        '<tr><td><b>ID:</b></td><td id="fpid">&nbsp;123</td></tr>' +
        '<tr><td><b>name:</b></td><td id="fpname">&nbsp;</td></tr>' +
        '<tr><td><b>URL:</b></td><td id="fpurl">&nbsp;</td></tr>' +
        '<tr><td><b>Level:</b></td><td id="fpfloorLevel">&nbsp;</td></tr>' +
        '<tr><td><b>Bearing:</b></td><td id="fpbearing">&nbsp;</td></tr>' +
        '<tr><td><b>Size:</b></td><td id="fpbitmapsize">&nbsp;</td></tr>' +
        '<tr><td><b>MetersToPixels:</b></td><td id="fpmetersToPixels">&nbsp;</td></tr>' +
        '<tr><td><b>PixelsToMeters:</b></td><td id="fppixelsToMeters">&nbsp;</td></tr>' +
        '<tr><td><b>BottomLeft:</b></td><td id="fpbottomLeft">&nbsp;</td></tr>' +
        '<tr><td><b>Center:</b></td><td id="fpcenter">&nbsp;</td></tr>' +
        '<tr><td><b>TopLeft:</b></td><td id="fptopLeft">&nbsp;</td></tr>' +
        '<tr><td><b>TopRight:</b></td><td id="fptopRight">&nbsp;</td></tr>' +
        '</table>' +
        '</div>',

        actions =
        '<div id="cordova-getLocation"></div>' +
        'Expected result: Will update all applicable values in the status box for the current location. Status will show as Retrieving Location (may not see this if location is retrieved immediately) and then show as Done.' +
        '<p/> <div id="cordova-watchLocation"></div>' +
        'Expected result: Will update all applicable values in the status box for the current location, and continue updating it as the location changes. Status will show as Running.' +
        '<p/> <div id="cordova-stopLocation"></div>' +
        'Expected result: Will stop watching the location. Status box values will not be updated. Status will show as Stopped.' +
        '<p/> <div id="cordova-setposition"></div>' +
        'Expected result: Will display the new Geo Location data for the region value = b95c61ff-bdf5-46dd-80ee-3fa322374d62' +
        '<p/> <div id="cordova-setpositioncoordinate"></div>' +
        'Expected result: Will display the new Geo Location data from the region coordinates of region value = b95c61ff-bdf5-46dd-80ee-3fa322374d62' +
        region_div +
        '<p/> <div id="cordova-watch"></div>' +
        'Expected result: Will update region with new region.' +
        '<p/> <div id="cordova-stopwatch"></div>' +
        'Expected result: Will stop watching the region. Status will show as Stopped.' +
        floorplan_div +
        '<p/> <div id="cordova-fpid"></div>' +
        'Expected result: Will return FloorPlan info from server.',

        values_info =
        '<h3>Details about each value are listed below in the status box</h3>',
        note =
        '<h3>Allow use of current location, if prompted</h3>';

        contentEl.innerHTML = values_info + location_div + latitude + longitude + region + floornumber + altitude + accuracy + heading + speed + time + note + actions;

        createActionButton('Get Location', function () {
          getLocation();
        }, 'cordova-getLocation');

        createActionButton('Start Watching Location', function () {
          watchLocation();
        }, 'cordova-watchLocation');

        createActionButton('Stop Watching Location', function () {
          stopLocation();
        }, 'cordova-stopLocation');

        createActionButton('Watch Region', function () {
          watchRegion();
        }, 'cordova-watch');

        createActionButton('Stop Watching Region', function () {
          stopRegion();
        }, 'cordova-stopwatch');

        createActionButton('Set New Position(Region)', function () {
          setNewPosition({ regionId: 'b95c61ff-bdf5-46dd-80ee-3fa322374d62' });
        }, 'cordova-setposition');
        createActionButton('Set New Position(coordinate)', function () {
          setNewPosition({ coordinates: [37.784013, -122.406872] });
        }, 'cordova-setpositioncoordinate');

        createActionButton('FloorPlan Info', function () {
          floorPlanWithid("b95c61ff-bdf5-46dd-80ee-3fa322374d62");
        }, 'cordova-fpid');
      };
