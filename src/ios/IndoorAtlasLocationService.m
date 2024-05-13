
#import <UIKit/UIKit.h>
#import "IndoorAtlasLocationService.h"

@interface IndoorAtlasLocationService()<IALocationManagerDelegate> {
}

@property (nonatomic, strong) IALocationManager *manager;
@property (nonatomic, retain) NSString *apikey;
@property (nonatomic, retain) NSString *apiSecret;
@property (nonatomic, strong) IAFloorPlan *previousFloorplan;
@end

@implementation IndoorAtlasLocationService {
    BOOL serviceStopped;
}

- (id)init
{
    [NSException raise:@"API keys invalid" format:@"Missing IndoorAtlas Credential"];
    return nil;
}

/**
 *  IndoorAtlas Navigation
 *
 *  @param apikey    IndoorAtlas key
 *  @param pluginVersion IA cordova plugin version
 *
 *  @return Object for indoor navigation
 */
- (id)init:(NSString *)apikey pluginVersion:(NSString *)pluginVersion
{
    self = [super init];
    if (self) {
        self.apikey = apikey;
        // Create IALocationManager and point delegate to receiver
        self.manager = [IALocationManager sharedInstance];
        
        // react.native
        [self.manager setObject:@{ @"name": @"react-native", @"version": pluginVersion} forKey:@"IAWrapper"];

        // Set IndoorAtlas API key
        [self.manager setApiKey:self.apikey andSecret:@""];

        self.manager.delegate = self;
        serviceStopped = YES;
    }
    return self;
}

#pragma mark IALocationManager delegate methods

/**
 *  Start positioning
 */
- (void)startPositioning
{
    serviceStopped = NO;
    [self.manager startUpdatingLocation];
    [self setCriticalLog:[NSString stringWithFormat:@"IndoorAtlas positioning started"]];
}

/**
 *  Stop positioning
 */
- (void)stopPositioning
{
    serviceStopped = YES;
    [self.manager stopUpdatingLocation];
    [self setCriticalLog:@"IndoorAtlas positioning stopped"];
}

/**
 * Sets explicit position
 */
- (void)setPosition:(IALocation *)position
{
    self.manager.location = position;
}


#pragma mark IndoorAtlasPositionerDelegate methods
/**
 * Tells the delegate that the user entered the specified region.
 * @param manager The location manager object that generated the event.
 * @param region The region related to event.
 */
- (void)indoorLocationManager:(nonnull IALocationManager *)manager didEnterRegion:(nonnull IARegion *)region
{
    if([self.delegate respondsToSelector:@selector(location:didRegionChange:type:)]) {
        [self.delegate location:self didRegionChange:region type:TRANSITION_TYPE_ENTER];
    }
}

/**
 * Tells the delegate that the user left the specified region.
 * @param manager The location manager object that generated the event.
 * @param region The region related to event.
 */
- (void)indoorLocationManager:(nonnull IALocationManager *)manager didExitRegion:(nonnull IARegion *)region
{
    if([self.delegate respondsToSelector:@selector(location:didRegionChange:type:)]) {
        [self.delegate location:self didRegionChange:region type:TRANSITION_TYPE_EXIT];
    }
}

/**
 *  Handle location update
 *
 *  @param manager
 *  @param locations new location  array
 */
- (void)indoorLocationManager:(IALocationManager *)manager didUpdateLocations:(NSArray *)locations
{
    IALocation *loc = [locations lastObject];
    IAFloor *floorID = [(IALocation *)locations.lastObject floor];
    if (floorID == nil) {
        NSLog(@"Invalid Floor");
        return;
    }

    if(self.delegate != nil) {
        [self.delegate location:self didUpdateLocation:loc];
    }
}

/**
 *  Status Changed
 *
 *  @param manager
 *  @param status
 */
- (void)indoorLocationManager:(nonnull IALocationManager *)manager statusChanged:(nonnull IAStatus *)status
{
    if([self.delegate respondsToSelector:@selector(location:statusChanged:)]) {
        [self.delegate location:self statusChanged:status];
    }
}

- (void)indoorLocationManager:(nonnull IALocationManager *)manager didUpdateAttitude:(nonnull IAAttitude *)newAttitude
{
    if([self.delegate respondsToSelector:@selector(location:didUpdateAttitude:)]) {
        [self.delegate location:self didUpdateAttitude:newAttitude];
    }
}

- (void)indoorLocationManager:(nonnull IALocationManager *)manager didUpdateHeading:(nonnull IAHeading *)newHeading
{
    if([self.delegate respondsToSelector:@selector(location:didUpdateHeading:)]) {
        [self.delegate location:self didUpdateHeading:newHeading];
    }
}

- (void)indoorLocationManager:(IALocationManager *)manager didUpdateRoute:(nonnull IARoute *)route
{
    if([self.delegate respondsToSelector:@selector(location:didUpdateRoute:)]) {
        [self.delegate location:self didUpdateRoute:route];
    }
}

- (void)indoorLocationManager:(nonnull IALocationManager *)manager didRangeBeacons:(nonnull NSArray<CLBeacon *> *)beacons
{
    if([self.delegate respondsToSelector:@selector(location:didRangeBeacons:)]) {
        [self.delegate location:self didRangeBeacons:beacons];
    }
}

- (void)indoorLocationManager:(nonnull IALocationManager *)manager rangingBeaconsDidFailForRegion:(nonnull CLBeaconRegion *)region
                                                                                        withError:(nonnull NSError *)error
{
    if([self.delegate respondsToSelector:@selector(location:rangingBeaconsDidFailForRegion:withError:)]) {
        [self.delegate location:self rangingBeaconsDidFailForRegion:region withError:error];
    }
}

- (void)valueForDistanceFilter:(float *)distance
{
    self.manager.distanceFilter = (CLLocationDistance) *(distance);
}

- (void)valueForTimeFilter:(float *)interval
{
    self.manager.timeFilter = (NSTimeInterval) *(interval);
}

- (void)setDesiredAccuracy:(ia_location_accuracy)accuracy
{
    self.manager.desiredAccuracy = accuracy;
}

- (float)fetchFloorCertainty
{
  return [IALocationManager sharedInstance].location.floor.certainty;
}

- (NSString *)fetchTraceId
{
  return [[IALocationManager sharedInstance].extraInfo objectForKey:kIATraceId];
}

- (void)setSensitivities:(double *)orientationSensitivity headingSensitivity:(double *)headingSensitivity
{
    self.manager.attitudeFilter = (CLLocationDegrees) *(orientationSensitivity);
    self.manager.headingFilter = (CLLocationDegrees) *(headingSensitivity);
}


#pragma mark Supporting methods
/**
 *  Error Log in console
 *
 *  @param state
 */
-(void)setCriticalLog:(NSString *)state
{
    //NSLog(@"%@",state);
}

/**
 *  Flag is service running
 *
 *  @return YES/NO
 */
- (BOOL)isServiceActive
{
    return !serviceStopped;
}

/**
 *  Lock positioning to indoors
 */
- (void)lockIndoors:(BOOL)lock
{
    [self.manager lockIndoors:lock];
}

/**
 *  Lock positioning to a given floor
 */
- (void)setFloorLock:(int)floor
{
    [self.manager lockFloor:floor];
}

/**
 *  Unlock floor lock
 */
- (void)unlockFloor
{
    [self.manager unlockFloor];
}

/**
 * Start monitoring wayfinding updates.
 * @param request A wayfinding request to destination.
 */
- (void)startMonitoringForWayfinding:(IAWayfindingRequest*)request
{
    NSLog(@"startMonitoringForWayfinding: %f, %f, %ld", request.coordinate.latitude, request.coordinate.longitude, request.floor);
    [self.manager startMonitoringForWayfinding:request];
}

/**
 *  Stop monitoring wayfinding updates.
 */
- (void)stopMonitoringForWayfinding
{
    [self.manager stopMonitoringForWayfinding];
}

- (void)requestWayfindingRouteFrom:(nonnull id<IALatLngFloorCompatible>)from to:(nonnull id<IALatLngFloorCompatible>)to callback:(void(^_Nonnull)(IARoute *_Nonnull))callback
{
    [self.manager requestWayfindingRouteFrom:from to:to callback:callback];
}

- (void)startMonitoringGeofences:(IAGeofence *)geofence
{
    NSLog(@"startMonitoringGeofence: %@, floor %ld", geofence.name, geofence.floor.level);
    [self.manager startMonitoringForGeofence:geofence];
}

- (void)stopMonitoringGeofences:(IAGeofence *)geofence
{
    NSLog(@"stopMonitoringGeofence: %@, floor %ld", geofence.name, geofence.floor.level);
    [self.manager stopMonitoringForGeofence:geofence];
}

- (void)startMonitoringForBeacons
{
    NSLog(@"startMonitoringForBeacons");
    [self.manager startMonitoringForBeacons];
}

- (void)stopMonitoringForBeacons
{
    NSLog(@"stopMonitoringForBeacons");
    [self.manager stopMonitoringForBeacons];
}

@end
