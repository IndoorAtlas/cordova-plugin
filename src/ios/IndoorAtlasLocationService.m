
#import <UIKit/UIKit.h>
#import "IndoorAtlasLocationService.h"
#import <IndoorAtlas/IAResourceManager.h>

@interface IndoorAtlasLocationService()<IALocationManagerDelegate> {
}

@property (nonatomic, strong) IALocationManager *manager;
@property (nonatomic, strong) IAResourceManager *resourceManager;
@property (nonatomic, retain) NSString *apikey;
@property (nonatomic, retain) NSString *apiSecret;
@property (nonatomic, retain) NSString *graphicID;
@property (nonatomic, strong) IAFloorPlan *previousFloorplan;
@end

@implementation IndoorAtlasLocationService {
    BOOL serviceStoped;
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
        serviceStoped = YES;

        // Create floor plan manager
        self.resourceManager = [IAResourceManager resourceManagerWithLocationManager:self.manager];
    }
    return self;
}

#pragma mark IALocationManager delegate methods

/**
 *  Start IndoorAtlas service
 *
 *  @param floorid
 */
- (void)startPositioning:(NSString *)floorid
{
    serviceStoped = NO;
    self.graphicID = floorid;
    [self setCriticalLog:[NSString stringWithFormat:@"Started service for floorid %@", self.graphicID]];
    [self.manager stopUpdatingLocation];
    if (self.graphicID != nil) {
        IALocation *location = [IALocation locationWithFloorPlanId:self.graphicID];
        self.manager.location = location;
    }
    [self.manager startUpdatingLocation];
}

- (void)stopPositioning
{
    serviceStoped = YES;
    [self.manager stopUpdatingLocation];
    [self setCriticalLog:@"IndoorAtlas service stopped"];
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

// Gets coordinate to a given point
- (void)getCoordinateToPoint:(NSString *)floorplanId andCoordinates: (CLLocationCoordinate2D) coords
{
    NSLog(@"getCoordinateToPoint: previousFloorplanName %@", _previousFloorplan.name);
    NSLog(@"getCoordinateToPoint: longitude %f", coords.longitude);
    NSLog(@"getCoordinateToPoint: latitude %f", coords.latitude);

    __weak IndoorAtlasLocationService *weakSelf = self;

    // New floorplan information is not fetched if current and previous ids are the same
    // Finally, sendCoordinateToPoint function is called which prepares the data for Cordova and Javascript
    if ([floorplanId isEqualToString:self.previousFloorplan.floorPlanId]) {

        CGPoint points = [self.previousFloorplan coordinateToPoint:coords];
        [weakSelf.delegate sendCoordinateToPoint:points];

    } else {

        // Fetches new floorplan information and calls sendCoordinateToPoint to send the data to Cordova and Javcascript.
        [self.resourceManager fetchFloorPlanWithId:floorplanId andCompletion:^(IAFloorPlan *floorplan, NSError *error) {
            if (error) {
                NSLog(@"Error during floorplan fetch: %@", error);
                if ([weakSelf.delegate respondsToSelector:@selector(errorInCoordinateToPoint:)]) {
                    [weakSelf.delegate errorInCoordinateToPoint:[NSError errorWithDomain:@"Service Unavailable" code:kIAStatusServiceUnavailable userInfo:nil]];};

                /*if ([weakSelf.delegate respondsToSelector:@selector(location:didFloorPlanFailedWithError:)]) {
                    [weakSelf.delegate  location:weakSelf didFloorPlanFailedWithError:[NSError errorWithDomain:@"Service Unavailable" code:kIAStatusServiceUnavailable userInfo:nil]];
                }*/
                return;
            }

            NSLog(@"getCoordinateToPoint: fetched floorplan with id: %@", floorplan.floorPlanId);
            CGPoint points = [floorplan coordinateToPoint:coords];
            NSLog(@"getCoordinateToPoint: point %@", NSStringFromCGPoint(points));
            self.previousFloorplan = floorplan;
            [weakSelf.delegate sendCoordinateToPoint:points];
        }];
    };
}

// Gets point to a given coordinate
- (void)getPointToCoordinate:(NSString *)floorplanId andPoint: (CGPoint) point
{
    NSLog(@"getPointToCoordinate: previousFloorplanName %@", _previousFloorplan.name);
    NSLog(@"getPointToCoordinate: point %@", NSStringFromCGPoint(point));

    __weak IndoorAtlasLocationService *weakSelf = self;

    // New floorplan information is not fetched if current and previous ids are the same
    // Finally, sendCoordinateToPoint function is called which prepares the data for Cordova and Javascript
    if (floorplanId == self.previousFloorplan.floorPlanId) {

        CLLocationCoordinate2D coords = [self.previousFloorplan pointToCoordinate:point];
        [weakSelf.delegate sendPointToCoordinate:coords];
    } else {

        // Fetches new floorplan information and calls sendPointToCoordinate to send the data to Cordova and Javcascript.
        [self.resourceManager fetchFloorPlanWithId:floorplanId andCompletion:^(IAFloorPlan *floorplan, NSError *error) {
            if (error) {
                NSLog(@"Error during floorplan fetch: %@", error);
                if ([weakSelf.delegate respondsToSelector:@selector(errorInPointToCoordinate:)]) {
                    [weakSelf.delegate errorInPointToCoordinate:[NSError errorWithDomain:@"Service Unavailable" code:kIAStatusServiceUnavailable userInfo:nil]];};
                return;
            }

            NSLog(@"getPointToCoordinate: fetched floorplan with id: %@", floorplan.floorPlanId);
            CLLocationCoordinate2D coords = [floorplan pointToCoordinate:point];
            self.previousFloorplan = floorplan;
            NSLog(@"getPointToCoordinate: latitude %f", coords.latitude);
            NSLog(@"getPointToCoordinate: longitude %f", coords.longitude);
            [weakSelf.delegate sendPointToCoordinate:coords];
        }];
    };
}

#pragma mark Resource Manager
/**
 * Fetch floor plan and image with ID
 * These methods are just wrappers around server requests.
 * You will need api key and secret to fetch resources.
 */
- (void)fetchFloorplanWithId:(NSString *)floorplanId callbackId:(NSString *)callbackId
{
    __weak IndoorAtlasLocationService *weakSelf = self;
    [self.resourceManager fetchFloorPlanWithId:floorplanId andCompletion:^(IAFloorPlan *floorplan, NSError *error) {
        if (error) {
            NSLog(@"Error during floorplan fetch: %@", error);
            if ([weakSelf.delegate respondsToSelector:@selector(location:didFloorPlanFailedWithError:)]) {
                [weakSelf.delegate  location:weakSelf didFloorPlanFailedWithError:[NSError errorWithDomain:@"Service Unavailable" code:kIAStatusServiceUnavailable userInfo:nil]];
            }
            return;
        }

        NSLog(@"fetched floorplan with id: %@", floorplanId);
        if ([weakSelf.delegate respondsToSelector:@selector(location:withFloorPlan: callbackId:)]) {
            [weakSelf.delegate  location:weakSelf withFloorPlan:floorplan callbackId:callbackId];
        }
    }];
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
    return !serviceStoped;
}
- (void)setFloorPlan:(NSString *)floorPlan orLocation:(CLLocation *)newLocation
{
    BOOL isServiceResume = [self isServiceActive];
    [self.manager stopUpdatingLocation];
    if (floorPlan != nil) {
        IALocation *location = [IALocation locationWithFloorPlanId:floorPlan];
        self.manager.location = location;
    }
    if (newLocation != nil) {
        IALocation *location = [IALocation locationWithCLLocation:newLocation];
        self.manager.location = location;
    }
    if (isServiceResume) {
        [self.manager startUpdatingLocation];
    }
}
@end
