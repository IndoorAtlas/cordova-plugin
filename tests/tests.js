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

            it("test.spec.1 should exist", function () {
                expect(IndoorAtlas).toBeDefined();
            });

            it("test.spec.2 should contain a getCurrentPosition function", function () {
                expect(typeof IndoorAtlas.getCurrentPosition).toBeDefined();
                expect(typeof IndoorAtlas.getCurrentPosition == 'function').toBe(true);
            });

            it("test.spec.3 should contain a watchPosition function", function () {
                expect(typeof IndoorAtlas.watchPosition).toBeDefined();
                expect(typeof IndoorAtlas.watchPosition == 'function').toBe(true);
            });

            it("test.spec.4 should contain a clearWatch function", function () {
                expect(typeof IndoorAtlas.clearWatch).toBeDefined();
                expect(typeof IndoorAtlas.clearWatch == 'function').toBe(true);
            });
            it("test.spec.11 should contain a fetchFloorPlanWithId function", function () {
                expect(typeof IndoorAtlas.fetchFloorPlanWithId).toBeDefined();
                expect(typeof IndoorAtlas.fetchFloorPlanWithId == 'function').toBe(true);
            });

        });

        describe('getCurrentPosition method', function () {

            describe('error callback', function () {

                it("test.spec.5 should be called if we set timeout to 0", function (done) {
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

                it("test.spec.9 on failure should return PositionError object with error code constants", function (done) {
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

            describe('success callback', function () {
                it("test.spec.6 should be called with a Position object", function (done) {
                    if (skipAndroid) {
                        pending();
                    }

                    IndoorAtlas.getCurrentPosition(function (p) {
                        expect(p.coords).toBeDefined();
                        expect(p.timestamp).toBeDefined();
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
                }, 50000); // first geolocation call can take several seconds on some devices
            });

        });

        describe('watchPosition method', function () {

            beforeEach(function (done) {
                // This timeout is set to lessen the load on platform's geolocation services
                // which were causing occasional test failures
                setTimeout(function () {
                    done();
                }, 100);
            });

            describe('error callback', function () {

                var errorWatch = null;
                afterEach(function () {
                    IndoorAtlas.clearWatch(errorWatch);
                });

                it("test.spec.7 should be called if we set timeout to 0", function (done) {
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

                it("test.spec.10 on failure should return PositionError object with error code constants", function (done) {
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

            describe('success callback', function () {

                var successWatch = null;
                afterEach(function () {
                    IndoorAtlas.clearWatch(successWatch);
                });

                it("test.spec.8 should be called with a Position object", function (done) {
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
                                                                 expect(p.timestamp).toBeDefined();
                                                                 // callback could be called sync so we invoke done async to make sure we know watcher id to .clear in afterEach
                                                                 setTimeout(function () {
                                                                     done();
                                                                 });
                                                             },
                                                             fail.bind(null, done, context, 'Unexpected fail callback'));
                    expect(successWatch).toBeDefined();
                });

            });

        });
        describe('fetchFloorPlanWithID method', function () {
            describe('error callback', function () {
                it("test.spec.13 Failed as Wrong FloorPlan id Pass", function (done) {
                    if (skipAndroid) {
                        pending();
                    }

                    IndoorAtlas.fetchFloorPlanWithId("Wrongid", fail.bind(null, done),
                                                     succeed.bind(null, done));
                }, 25000);
            });

            describe('success callback', function () {
                it("test.spec.12 should be called with a fetchFloorPlan object", function (done) {
                    if (skipAndroid) {
                        pending();
                    }

                    IndoorAtlas.fetchFloorPlanWithId("b95c61ff-bdf5-46dd-80ee-3fa322374d62", function (p) {
                        expect(p.url).toBeDefined();
                        expect(p.id).toBeDefined();
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
                }, 50000);
                it("test.spec.14 should be called error object as wrong floor plan pass ", function (done) {
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

