Version 3.6.8 - August 2024
----------------
 * Update IndoorAtlas SDKs to 3.6.11
 * Now uses IA fork of @remobile/react-native-cordova
 * Fix lat/lon parameters getting truncated in addDynamicGeofence, requestWayfindingRoute and setPosition APIs
 * Now supports also npm install (previously only yarn install was supported)

Version 3.6.7 - June 2024
----------------
 * Update IndoorAtlas SDKs to 3.6.10

Version 3.6.6 - May 2024
----------------
 * Add radio scan callbacks API (NOTE! To enable the callbacks, please contact IndoorAtlas support)

Version 3.6.5 - May 2024
----------------
 * Fixed compile on iOS

Version 3.6.4 - May 2024
----------------
 * Update IndoorAtlas SDKs to 3.6.9

Version 3.6.3 - January 2024
----------------
 * Update IndoorAtlas SDKs to 3.6.7 (iOS) and 3.6.8 (Android)

Version 3.6.2 - December 2023
----------------
 * Update IndoorAtlas SDKs to 3.6.6 (iOS) and 3.6.7 (Android)

Version 3.6.1 - October 2023
----------------
 * Update IndoorAtlas SDKs to 3.6.4
 * add workaround to support Android Gradle buildtools version 33

Version 3.6.0 - June 2023
----------------
 * Update IndoorAtlas SDKs to 3.6.3

Version 3.5.1 - August 2022
----------------
 * Fix status callback

Version 3.5.0 - August 2022
----------------
 * Update IndoorAtlas SDKs to 3.5.5
 * iOS: fix JSON serialization issue with position object
 * Android: add BLUETOOTH_SCAN permission. The plugin now requires compile and target sdk version 31

Version 3.4.5 - February 2022
----------------
 * Update IndoorAtlas SDKs to 3.4.12
 * Fixed disabling of indoor lock

Version 3.4.4 - September 2021
----------------
 * Update IndoorAtlas SDKs to 3.4.9
 * Fix broken package.json in last release

Version 3.4.3 - June 2021
----------------
 * Update IndoorAtlas SDKs to 3.4.7

Version 3.4.2 - April 2021
----------------
 * Android SDK repository moved from Bintray to Cloudsmith

Version 3.4.1 - March 2021
----------------
 * Update IndoorAtlas SDKs to 3.4.3
 * Prepare for React.Native support (available in `react-native` branch)

Version 3.4.0 - February 2021
----------------
 * Update IndoorAtlas SDKs to 3.4.2
 * Add wayfinding A->B route request support
 * Add time based location updates support
 * Add low power and cart-mode support

Version 3.3.2 - November 2020
----------------
 * Update IndoorAtlas SDKs to 3.3.6

Version 3.3.1 - September 2020
----------------
 * Update IndoorAtlas SDKs to 3.3.5

Version 3.3.0 - March 2020
----------------
 * Add geofence and POI support
 * Update IndoorAtlas SDKs to 3.3.3

Version 3.2.1 - March 2020
----------------
 * Add geofence and POI support
 * Update IndoorAtlas SDKs to 3.2.1

Version 3.1.4 - February 2020
----------------
 * Update IndoorAtlas SDKs to 3.1.4

Version 3.1.3 - December 2019
----------------
 * Update IndoorAtlas SDKs to 3.1.3
 * Fix iOS support with SDK 3.1.2 (#40)

Version 3.1.2 - November 2019
----------------
 * Update IndoorAtlas SDKs to 3.1.2

Version 3.1.1 - October 2019
----------------
 * Update IndoorAtlas SDKs to 3.1.1

Version 3.1.0 - October 2019
----------------
* Update IndoorAtlas SDKs to 3.1.0
* Fixed setPosition for iOS and Android (#38, #39)
* Fixed bug in error message (#37)

Version 3.0.2 - September 2019
----------------
 * Fix Android crash in case of repeated deviceready (#36)

Version 3.0.1 - August 2019
----------------
 * Fix FloorPlan.coordinateToPoint & pointToCoordinate. Both methods
   crashed with a JavaScript error before this fix

Version 3.0.0 - June 2019
----------------
 * new API

Version 2.10.3 - June 2019
------------------------------
 * Update IndoorAtlas SDKs to 3.0.3

Version 2.10.2 - June 2019
------------------------------
 * Update IndoorAtlas SDKs to 3.0.2

Version 2.10.1 - May 2019
------------------------------
 * Update IndoorAtlas SDKs to 3.0.1

Version 2.10.0 - April 2019
------------------------------
 * Backwards compatibility release: The 2.x IndoorAtlas Cordova API will not
   be maintained after the 2.10.x versions
 * Update IndoorAtlas iOS SDK to 3.0 while keeping the current Cordova API
 * Minumum supported Android minSdkVersion raised to 21

Version 2.9.1 - March 2019
------------------------------
 * Update IndoorAtlas iOS SDK to version 2.9.4
 * Update IndoorAtlas Android SDK to version 2.9.3
 * Implement missing setPosition on iOS

Version 2.9.0 - September 2018
------------------------------
 * IndoorAtlas SDK version 2.9 with integrated wayfinding
 * New wayfinding API
 * iOS bug fix: changed floor level number from string to integer

Version 1.10.0 - August 2018
------------------------------
* IndoorAtlas Wayfinding SDK version 2.8: directed edge support

Version 1.9.0 - August 2018
------------------------------
* IndoorAtlas SDK version 2.8

Version 1.8.4 - April 2018
------------------------------
* Add support for setting explicit venue ID

Version 1.8.3 - April 2018
------------------------------
* Update IndoorAtlas Wayfinding libraries to 2.7.1

Version 1.8.2 - March 2018
------------------------------
* Rename Promise to IAPromise to avoid possible errors

Version 1.8.1 - March 2018
------------------------------
* Fix bug when fetching multiple floor plans at once

Version 1.8.0 - March 2018
------------------------------
* New APIs for coordinateToPoint and pointToCoordinate
