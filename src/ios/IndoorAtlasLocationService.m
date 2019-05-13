
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
 *  @param apisecret IndoorAtlas secret
 *
 *  @return Object for indoor navigation
 */
- (id)init:(NSString *)apikey hash:(NSString *)apisecret
{
    self = [super init];
    if (self) {
        self.apikey = apikey;
        self.apiSecret = apisecret;
        // Create IALocationManager and point delegate to receiver
        self.manager = [IALocationManager new];

        // Set IndoorAtlas API key and secret
        [self.manager setApiKey:self.apikey andSecret:self.apiSecret];

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

- (void)valueForDistanceFilter:(float *)distance
{
    self.manager.distanceFilter = (CLLocationDistance) *(distance);
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
@end
