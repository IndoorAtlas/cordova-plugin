
#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>
#import <IndoorAtlas/IALocationManager.h>

enum IndoorLocationTransitionType {
    TRANSITION_TYPE_UNKNOWN = 0,
    TRANSITION_TYPE_ENTER,
    TRANSITION_TYPE_EXIT
};
typedef NSUInteger IndoorLocationTransitionType;

@class IndoorAtlasLocationService;
@protocol IALocationDelegate <NSObject>

/**
 *  Invoked when a new location is available.
 *
 *  @param manager
 *  @param newLocation
 */
- (void)location:(IndoorAtlasLocationService *)manager didUpdateLocation:(IALocation *)newLocation;
@optional
/**
 *  Invoked when error in IndoorAtlas location
 *
 *  @param manager
 *  @param error
 */
- (void)location:(IndoorAtlasLocationService *)manager didFailWithError:(NSError *)error;
/**
 *  Tells the delegate that the user entered/Exit the specified region
 *
 *  @param manager The location manager object that generated the event
 *  @param region  The region related to event
 */
- (void)location:(IndoorAtlasLocationService *)manager didRegionChange:(IARegion *)region type:(IndoorLocationTransitionType)enterOrExit;

/**
 *  Status Changed
 *
 *  @param manager
 *  @param status
 */
- (void)location:(IndoorAtlasLocationService *)manager statusChanged:(IAStatus *)status;

/**
 *  UpdatedAttitude callback
 *
 *  @param manager
 *  @param newAttitude
 */
- (void)location:(IndoorAtlasLocationService *)manager didUpdateAttitude:(IAAttitude *)newAttitude;

/**
 * Updated when a wayfinding route update is available.
 *
 * @param route Updated wayfinding route.
 */
- (void)location:(IndoorAtlasLocationService *)manager didUpdateRoute:(nonnull IARoute *)route;

- (void)location:(IndoorAtlasLocationService *)manager didRangeBeacons:(nonnull NSArray<CLBeacon *> *)beacons;

- (void)location:(IndoorAtlasLocationService *)manager rangingBeaconsDidFailForRegion:(nonnull CLBeaconRegion *)region
                                                                            withError:(nonnull NSError *)error;

@end
@interface IndoorAtlasLocationService : NSObject{

}

@property (nonatomic, weak) id <IALocationDelegate> delegate;

- (id)init:(NSString *)apikey pluginVersion:(NSString *)pluginVersion;
/**
 *  Start positioning
 *
 */
- (void)startPositioning;

/**
 *  Stop positioning
 */
- (void)stopPositioning;

/**
 * Sets explicit position
 */
- (void)setPosition:(IALocation *)position;

/**
 *  State is service active or not
 *
 *  @return YES/NO
 */
-(BOOL)isServiceActive;

/**
 *  Lock positioning to indoors
 */
- (void)lockIndoors:(BOOL)lock;

/**
 *  Lock positioning to a given floor
 */
- (void)setFloorLock:(int)floor;

/**
 *  Unlock floor lock
 */
- (void)unlockFloor;

/**
 * Start monitoring wayfinding updates.
 * @param request A wayfinding request to destination.
 */
- (void)startMonitoringForWayfinding:(IAWayfindingRequest*)request;

/**
 *  Stop monitoring wayfinding updates.
 */
- (void)stopMonitoringForWayfinding;

- (void)requestWayfindingRouteFrom:(nonnull id<IALatLngFloorCompatible>)from to:(nonnull id<IALatLngFloorCompatible>)to callback:(void(^_Nonnull)(IARoute *_Nonnull))callback;

- (void)startMonitoringGeofences:(IAGeofence *)geofence;
- (void)stopMonitoringGeofences:(IAGeofence *)geofence;

- (void)startMonitoringForBeacons;
- (void)stopMonitoringForBeacons;

- (void)valueForDistanceFilter:(float)distance;
- (void)valueForTimeFilter:(float)interval;
- (void)setDesiredAccuracy:(ia_location_accuracy)accuracy;
- (float)fetchFloorCertainty;
- (NSString *)fetchTraceId;
- (void)setSensitivities:(double)orientationSensitivity;

@end
