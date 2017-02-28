#import "IndoorLocation.h"
#pragma mark IndoorLocationInfo

@implementation IndoorLocationInfo

- (IndoorLocationInfo*)init
{
    self = (IndoorLocationInfo*)[super init];
    if (self) {
        self.locationInfo = nil;
        self.locationCallbacks = nil;
        self.watchCallbacks = nil;
    }
    return self;
}

@end

#pragma mark -

#pragma mark IndoorLocationInfo

@implementation IndoorRegionInfo

- (IndoorRegionInfo*)init
{
    self = (IndoorRegionInfo*)[super init];
    if (self) {
        self.region = nil;
        self.regionStatus = TRANSITION_TYPE_UNKNOWN;
        self.watchCallbacks = nil;
    }
    return self;
}

@end

#pragma mark -

#pragma mark IndoorLocation
@interface IndoorLocation ()<IALocationDelegate> {
}

@property (nonatomic, strong) IndoorAtlasLocationService* IAlocationInfo;
@property (nonatomic, strong) NSString * watchingFloorPlanID;
@property (nonatomic, strong) NSString * floorPlanCallbackID;
@property (nonatomic, strong) NSString * coordinateToPointCallbackID;
@property (nonatomic, strong) NSString * pointToCoordinateCallbackID;
@property (nonatomic, strong) NSString * setDistanceFilterCallbackID;
@property (nonatomic, strong) NSString * getFloorCertaintyCallbackID;
@property (nonatomic, strong) NSString * getTraceIdCallbackID;

@end

@implementation IndoorLocation
{
    BOOL __locationStarted;
}


- (void)pluginInitialize
{
    self.locationManager = [[CLLocationManager alloc] init];
    __locationStarted = NO;
    self.locationData = nil;
    self.regionData = nil;
}

- (BOOL)isAuthorized
{
    BOOL authorizationStatusClassPropertyAvailable = [CLLocationManager respondsToSelector:@selector(authorizationStatus)]; // iOS 4.2+

    if (authorizationStatusClassPropertyAvailable) {
        NSUInteger authStatus = [CLLocationManager authorizationStatus];
#ifdef __IPHONE_8_0
        if ([self.locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {  //iOS 8.0+
            return (authStatus == kCLAuthorizationStatusAuthorizedWhenInUse) || (authStatus == kCLAuthorizationStatusAuthorizedAlways) || (authStatus == kCLAuthorizationStatusNotDetermined);
        }
#else
        return (authStatus == kCLAuthorizationStatusAuthorized) || (authStatus == kCLAuthorizationStatusNotDetermined);
#endif

    }

    // by default, assume YES (for iOS < 4.2)
    return YES;
}

- (BOOL)isLocationServicesEnabled
{
    BOOL locationServicesEnabledInstancePropertyAvailable = [self.locationManager respondsToSelector:@selector(locationServicesEnabled)]; // iOS 3.x
    BOOL locationServicesEnabledClassPropertyAvailable = [CLLocationManager respondsToSelector:@selector(locationServicesEnabled)]; // iOS 4.x

    if (locationServicesEnabledClassPropertyAvailable) { // iOS 4.x
        return [CLLocationManager locationServicesEnabled];
    } else if (locationServicesEnabledInstancePropertyAvailable) { // iOS 2.x, iOS 3.x
        return [(id)self.locationManager locationServicesEnabled];

    } else {
        return NO;
    }
}

- (void)startLocation
{
    if (![self isLocationServicesEnabled]) {
        [self returnLocationError:PERMISSION_DENIED withMessage:@"Location services are not enabled."];
        return;
    }
    if (![self isAuthorized]) {
        NSString* message = nil;
        BOOL authStatusAvailable = [CLLocationManager respondsToSelector:@selector(authorizationStatus)]; // iOS 4.2+
        if (authStatusAvailable) {
            NSUInteger code = [CLLocationManager authorizationStatus];
            if (code == kCLAuthorizationStatusNotDetermined) {
                // could return POSITION_UNAVAILABLE but need to coordinate with other platforms
                message = @"User undecided on application's use of location services.";
            } else if (code == kCLAuthorizationStatusRestricted) {
                message = @"Application's use of location services is restricted.";
            }
            else if(code == kCLAuthorizationStatusDenied) {
                message = @"Application's use of location services is restricted.";
            }
        }
        // PERMISSIONDENIED is only PositionError that makes sense when authorization denied
        [self returnLocationError:PERMISSION_DENIED withMessage:message];

        return;
    }

#ifdef __IPHONE_8_0
    NSUInteger code = [CLLocationManager authorizationStatus];
    if (code == kCLAuthorizationStatusNotDetermined && ([self.locationManager respondsToSelector:@selector(requestAlwaysAuthorization)] || [self.locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)])) { //iOS8+
        if([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"]) {
            [self.locationManager requestWhenInUseAuthorization];
        } else if([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"]) {
            [self.locationManager  requestAlwaysAuthorization];
        } else {
            NSLog(@"[Warning] No NSLocationAlwaysUsageDescription or NSLocationWhenInUseUsageDescription key is defined in the Info.plist file.");
        }
        return;
    }
#endif

    // Tell the location manager to start notifying us of location updates. We
    // first stop, and then start the updating to ensure we get at least one
    // update, even if our location did not change.
    //[self.locationManager stopUpdatingLocation];
    //[self.locationManager startUpdatingLocation];
    __locationStarted = YES;
    [self.locationManager stopUpdatingLocation];
    [self.IAlocationInfo startPositioning:self.watchingFloorPlanID];

}

- (void)_stopLocation
{
    BOOL stopLocationservice = YES;

    if(self.locationData && (self.locationData.watchCallbacks.count >0 ||self.locationData.locationCallbacks.count>0)) {
        stopLocationservice = NO;
    }
    else if(self.regionData && self.regionData.watchCallbacks.count>0) {
        stopLocationservice = NO;
    }
    if (stopLocationservice) {
        if (__locationStarted) {
            if (![self isLocationServicesEnabled]) {
                return;
            }

            [self.locationManager stopUpdatingLocation];
            __locationStarted = NO;
        }
        [self.IAlocationInfo stopPositioning];
    }
}

- (void)returnLocationInfo:(NSString*)callbackId andKeepCallback:(BOOL)keepCallback
{
    CDVPluginResult* result = nil;
    IndoorLocationInfo* lData = self.locationData;

    if (lData && !lData.locationInfo) {
        // return error
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:POSITION_UNAVAILABLE] forKey:@"code"];
        [posError setObject:@"Position not available" forKey:@"message"];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
    } else if (lData && lData.locationInfo) {
        CLLocation* lInfo = lData.locationInfo;
        NSMutableDictionary* returnInfo = [NSMutableDictionary dictionaryWithCapacity:10];
        NSNumber* timestamp = [NSNumber numberWithDouble:([lInfo.timestamp timeIntervalSince1970] * 1000)];
        [returnInfo setObject:timestamp forKey:@"timestamp"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.speed] forKey:@"velocity"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.verticalAccuracy] forKey:@"altitudeAccuracy"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.horizontalAccuracy] forKey:@"accuracy"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.course] forKey:@"heading"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.altitude] forKey:@"altitude"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.coordinate.latitude] forKey:@"latitude"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.coordinate.longitude] forKey:@"longitude"];

        [returnInfo setObject:lData.floorID forKey:@"flr"];
        if (lData.region != nil) {
            [returnInfo setObject:[self formatRegionInfo:lData.region andTransitionType:TRANSITION_TYPE_UNKNOWN] forKey:@"region"];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:returnInfo];
        [result setKeepCallbackAsBool:keepCallback];
    }
    if (result) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }
}

- (void)returnRegionInfo:(NSString*)callbackId andKeepCallback:(BOOL)keepCallback
{
    CDVPluginResult* result = nil;
    IndoorRegionInfo* lData = self.regionData;

    if (lData && !lData.region) {
        // return error
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:POSITION_UNAVAILABLE] forKey:@"code"];
        [posError setObject:@"Region not available" forKey:@"message"];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
    } else if (lData && lData.region) {
        NSMutableDictionary* returnInfo = [NSMutableDictionary dictionaryWithDictionary:[self formatRegionInfo:lData.region andTransitionType:lData.regionStatus]];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:returnInfo];
        [result setKeepCallbackAsBool:keepCallback];
    }
    if (result) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }
}

- (void)returnLocationError:(NSUInteger)errorCode withMessage:(NSString*)message
{
    NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];

    [posError setObject:[NSNumber numberWithUnsignedInteger:errorCode] forKey:@"code"];
    [posError setObject:message ? message:@"" forKey:@"message"];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];

    for (NSString* callbackId in self.locationData.locationCallbacks) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }

    [self.locationData.locationCallbacks removeAllObjects];

    for (NSString* callbackId in self.locationData.watchCallbacks) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }
}
- (NSDictionary *)formatRegionInfo:(IARegion*)regionInfo andTransitionType:(IndoorLocationTransitionType)transitionType
{
    NSMutableDictionary *result;
    result = [[NSMutableDictionary alloc] init];
    [result setObject:regionInfo.identifier forKey:@"regionId"];
    NSNumber* timestamp = [NSNumber numberWithDouble:([regionInfo.timestamp timeIntervalSince1970] * 1000)];
    [result setObject:timestamp forKey:@"timestamp"];
    [result setObject:[NSNumber numberWithInt:regionInfo.type] forKey:@"regionType"];
    [result setObject:[NSNumber numberWithInteger:transitionType] forKey:@"transitionType"];
    return result;
}
- (void)dealloc
{
    self.locationManager.delegate = nil;
}

- (void)onReset
{
    [self _stopLocation];
    [self.locationManager stopUpdatingHeading];
}


#pragma mark Expose Methods implementation

- (void)initializeIndoorAtlas:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    CDVPluginResult* pluginResult;
    NSDictionary *options = [command.arguments objectAtIndex:0];

    NSString *iakey = [options objectForKey:@"key"];
    NSString *iasecret = [options objectForKey:@"secret"];
    if (iakey == nil || iasecret == nil) {
        NSMutableDictionary* result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [result setObject:@"Invalid access token" forKey:@"message"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:result];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
    else{
        self.IAlocationInfo = [[IndoorAtlasLocationService alloc] init:iakey hash:iasecret];
        self.IAlocationInfo.delegate=self;

        NSMutableDictionary* result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:[NSNumber numberWithInt:0] forKey:@"code"];
        [result setObject:@"service Initialize" forKey:@"message"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }

}

- (void)setPosition:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;

    if (self.IAlocationInfo == nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];

    }
    else {
        NSString* region = [command.arguments objectAtIndex:0];
        NSArray* location = [command.arguments objectAtIndex:1];
        CLLocation *newLocation = nil;
        if([location count] == 2){
            newLocation = [[CLLocation alloc] initWithLatitude:[location[0] doubleValue] longitude:[location[1] doubleValue]];
        }

        [self.IAlocationInfo setFloorPlan:[region isEqualToString:@""]?nil:region orLocation:newLocation];
        if(region != nil){
            self.watchingFloorPlanID=region;
        }

        CDVPluginResult* pluginResult;
        NSMutableDictionary* result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:[NSNumber numberWithInt:0] forKey:@"code"];
        [result setObject:@"service Initialize" forKey:@"message"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
}

- (void)getLocation:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    if (self.IAlocationInfo == nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
        return;
    }

    if ([self isLocationServicesEnabled] == NO) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:PERMISSION_DENIED] forKey:@"code"];
        [posError setObject:@"Location services are disabled." forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    } else {
        if (!self.locationData) {
            self.locationData = [[IndoorLocationInfo alloc] init];
        }
        IndoorLocationInfo* lData = self.locationData;
        if (!lData.locationCallbacks) {
            lData.locationCallbacks = [NSMutableArray arrayWithCapacity:1];
        }

        if (!__locationStarted || _locationData.region == nil) {
            // add the callbackId into the array so we can call back when get data
            if (callbackId != nil) {
                [lData.locationCallbacks addObject:callbackId];
            }

            // Tell the location manager to start notifying us of heading updates
            [self startLocation];
        } else {
            [self returnLocationInfo:callbackId andKeepCallback:NO];
        }
    }
}

- (void)addWatch:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    if (self.IAlocationInfo == nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
        return;
    }
    NSString* timerId = [command argumentAtIndex:0];

    if (!self.locationData) {
        self.locationData = [[IndoorLocationInfo alloc] init];
    }
    IndoorLocationInfo* lData = self.locationData;

    if (!lData.watchCallbacks) {
        lData.watchCallbacks = [NSMutableDictionary dictionaryWithCapacity:1];
    }

    // add the callbackId into the dictionary so we can call back whenever get data
    [lData.watchCallbacks setObject:callbackId forKey:timerId];

    if ([self isLocationServicesEnabled] == NO) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:PERMISSION_DENIED] forKey:@"code"];
        [posError setObject:@"Location services are disabled." forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    } else {
        if (!__locationStarted) {
            // Tell the location manager to start notifying us of location updates
            [self startLocation];
        }
    }
}

- (void)clearWatch:(CDVInvokedUrlCommand*)command
{
    NSString* timerId = [command argumentAtIndex:0];

    if (self.locationData && self.locationData.watchCallbacks && [self.locationData.watchCallbacks objectForKey:timerId]) {
        [self.locationData.watchCallbacks removeObjectForKey:timerId];
        if([self.locationData.watchCallbacks count] == 0) {
            [self _stopLocation];
        }
    }
}

- (void)addRegionWatch:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    if (self.IAlocationInfo == nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
        return;
    }
    NSString* timerId = [command argumentAtIndex:0];

    if (!self.regionData) {
        self.regionData = [[IndoorRegionInfo alloc] init];
    }
    IndoorRegionInfo* lData = self.regionData;

    if (!lData.watchCallbacks) {
        lData.watchCallbacks = [NSMutableDictionary dictionaryWithCapacity:1];
    }

    // add the callbackId into the dictionary so we can call back whenever get data
    [lData.watchCallbacks setObject:callbackId forKey:timerId];

    if ([self isLocationServicesEnabled] == NO) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:PERMISSION_DENIED] forKey:@"code"];
        [posError setObject:@"Location services are disabled." forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    } else {
        if (!__locationStarted) {
            // Tell the location manager to start notifying us of location updates
            [self startLocation];
        }
    }
}

- (void)clearRegionWatch:(CDVInvokedUrlCommand*)command
{
    NSString* timerId = [command argumentAtIndex:0];

    if (self.regionData && self.regionData.watchCallbacks && [self.regionData.watchCallbacks objectForKey:timerId]) {
        [self.regionData.watchCallbacks removeObjectForKey:timerId];
        if([self.regionData.watchCallbacks count] == 0) {
            [self _stopLocation];
        }
    }
}

- (void)stopLocation:(CDVInvokedUrlCommand*)command
{
    [self _stopLocation];
}

- (void)fetchFloorplan:(CDVInvokedUrlCommand*)command{
    self.floorPlanCallbackID = command.callbackId;
    NSString* floorplanid = [command argumentAtIndex:0];
    [self.IAlocationInfo fetchFloorplanWithId:floorplanid];
}

// CoordinateToPoint Method
// Gets the arguments from the function call that is done in the Javascript side, then calls IALocationService's getCoordinateToPoint function
- (void)coordinateToPoint:(CDVInvokedUrlCommand*)command
{
    // Callback id of the call from Javascript side
    self.coordinateToPointCallbackID = command.callbackId;

    NSString* floorplanid = [command argumentAtIndex:2];
    NSString* latitude = [command argumentAtIndex:0];
    NSString* longitude = [command argumentAtIndex:1];

    CLLocationCoordinate2D coords = CLLocationCoordinate2DMake([latitude doubleValue], [longitude doubleValue]);
    NSLog(@"coordinateToPoint: latitude %f", coords.latitude);
    NSLog(@"coordinateToPoint: longitude %f", coords.longitude);

    [self.IAlocationInfo getCoordinateToPoint:floorplanid andCoordinates:coords];
}

// Prepares the result for Cordova plugin and Javascript side. Point is stored in dictionary which is then passed to Javascript side with the Cordova functions
- (void)sendCoordinateToPoint:(CGPoint) point
{
    NSLog(@"sendCoordinateToPoint: point %@", NSStringFromCGPoint(point));

    NSMutableDictionary* returnInfo = [NSMutableDictionary dictionaryWithCapacity:2];
    [returnInfo setObject:[NSNumber numberWithDouble:point.x] forKey:@"x"];
    [returnInfo setObject:[NSNumber numberWithDouble:point.y] forKey:@"y"];

    // Cordova plugin functions
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:returnInfo];
    [self.commandDelegate sendPluginResult:result callbackId:self.coordinateToPointCallbackID];
}

// PointToCoordinate Method
// Gets the arguments from the function call that is done in the Javascript side, then calls IALocationService's getPointToCoordinate function
- (void)pointToCoordinate:(CDVInvokedUrlCommand*)command
{
    // Callback id of the call from Javascript side
    self.pointToCoordinateCallbackID = command.callbackId;

    NSString* floorplanid = [command argumentAtIndex:2];
    NSString* x = [command argumentAtIndex:0];
    NSString* y = [command argumentAtIndex:1];

    NSLog(@"pointToCoordinate: x %@", x);
    NSLog(@"pointToCoordinate: y %@", y);

    CGPoint point = CGPointMake([x floatValue], [y floatValue]);

    [self.IAlocationInfo getPointToCoordinate:floorplanid andPoint:point];
}

// Prepares the result for Cordova plugin and Javascript side. Point is stored in dictionary which is then passed to Javascript side with the Cordova functions
- (void)sendPointToCoordinate:(CLLocationCoordinate2D)coords
{
    NSLog(@"sendPointToCoordinate: latitude %f", coords.latitude);
    NSLog(@"sendPointToCoordinate: longitude %f", coords.longitude);

    NSMutableDictionary* returnInfo = [NSMutableDictionary dictionaryWithCapacity:2];
    [returnInfo setObject:[NSNumber numberWithDouble:coords.latitude] forKey:@"latitude"];
    [returnInfo setObject:[NSNumber numberWithDouble:coords.longitude] forKey:@"longitude"];

    // Cordova plugin functions
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:returnInfo];
    [self.commandDelegate sendPluginResult:result callbackId:self.pointToCoordinateCallbackID];
}

- (void)setDistanceFilter:(CDVInvokedUrlCommand*)command
{
    self.setDistanceFilterCallbackID = command.callbackId;
    NSString* distance = [command argumentAtIndex:0];

    float d = [distance floatValue];
    [self.IAlocationInfo valueForDistanceFilter: &d];

    CDVPluginResult* pluginResult;
    NSMutableDictionary* result = [NSMutableDictionary dictionaryWithCapacity:2];
    [result setObject:[NSNumber numberWithInt:0] forKey:@"code"];
    [result setObject:@"DistanceFilter set" forKey:@"message"];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.setDistanceFilterCallbackID];
}

- (void)getFloorCertainty:(CDVInvokedUrlCommand*)command
{
  self.getFloorCertaintyCallbackID = command.callbackId;
  float certainty = [self.IAlocationInfo fetchFloorCertainty];

  CDVPluginResult* pluginResult;
  NSMutableDictionary* result = [NSMutableDictionary dictionaryWithCapacity:1];
  [result setObject:[NSNumber numberWithFloat:certainty] forKey:@"floorCertainty"];

  pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
  [self.commandDelegate sendPluginResult:pluginResult callbackId:self.getFloorCertaintyCallbackID];
}

- (void)getTraceId:(CDVInvokedUrlCommand*)command
{
  self.getTraceIdCallbackID = command.callbackId;
  NSString* traceId = [self.IAlocationInfo fetchTraceId];

  CDVPluginResult* pluginResult;
  NSMutableDictionary* result = [NSMutableDictionary dictionaryWithCapacity:1];
  [result setObject:traceId forKey:@"traceId"];

  pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
  [self.commandDelegate sendPluginResult:pluginResult callbackId:self.getTraceIdCallbackID];
}

#pragma mark IndoorAtlas Location
- (void)location:(IndoorAtlasLocationService *)manager didUpdateLocation:(IALocation *)newLocation
{
    IndoorLocationInfo* cData = self.locationData;

    cData.locationInfo = [[CLLocation alloc] initWithCoordinate:newLocation.location.coordinate altitude:0 horizontalAccuracy:newLocation.location.horizontalAccuracy verticalAccuracy:0 course:newLocation.location.course speed:0 timestamp:[NSDate date]];
    cData.floorID = [NSString stringWithFormat:@"%ld",newLocation.floor.level];
    cData.region = newLocation.region;
    if (self.locationData.locationCallbacks.count > 0) {
        for (NSString* callbackId in self.locationData.locationCallbacks) {
            [self returnLocationInfo:callbackId andKeepCallback:NO];
        }

        [self.locationData.locationCallbacks removeAllObjects];
    }
    if (self.locationData.watchCallbacks.count > 0) {
        for (NSString* timerId in self.locationData.watchCallbacks) {
            [self returnLocationInfo:[self.locationData.watchCallbacks objectForKey:timerId] andKeepCallback:YES];
        }
    } else {
        // No callbacks waiting on us anymore, turn off listening.
        [self _stopLocation];
    }
}

-(void)location:(IndoorAtlasLocationService *)manager didFailWithError:(NSError *)error
{
    NSLog(@"locationManager::didFailWithError %@", [error localizedFailureReason]);
    IndoorLocationInfo* lData = self.locationData;
    if (lData && __locationStarted) {
        // TODO: probably have to once over the various error codes and return one of:
        // PositionError.PERMISSION_DENIED = 1;
        // PositionError.POSITION_UNAVAILABLE = 2;
        // PositionError.TIMEOUT = 3;
        NSUInteger positionError = POSITION_UNAVAILABLE;
        [self returnLocationError:positionError withMessage:[error localizedDescription]];
    }
}

-(void)location:(IndoorAtlasLocationService *)manager didRegionChange:(IARegion *)region type:(IndoorLocationTransitionType)enterOrExit
{
    if (region == nil) {
        return;
    }
    IndoorRegionInfo * cData = self.regionData;
    cData.region = region;
    cData.regionStatus = enterOrExit;
    if (self.regionData.watchCallbacks.count > 0) {
        for (NSString* timerId in self.regionData.watchCallbacks) {
            [self returnRegionInfo:[self.regionData.watchCallbacks objectForKey:timerId] andKeepCallback:YES];
        }
    } else {
        // No callbacks waiting on us anymore, turn off listening.
        [self _stopLocation];
    }
}

-(void)location:(IndoorAtlasLocationService *)manager withFloorPlan:(IAFloorPlan *)floorPlan
{
    if (self.floorPlanCallbackID != nil) {
        NSMutableDictionary* returnInfo = [NSMutableDictionary dictionaryWithCapacity:17];

        NSNumber* timestamp = [NSNumber numberWithDouble:([[NSDate date] timeIntervalSince1970] * 1000)];
        [returnInfo setObject:timestamp forKey:@"timestamp"];
        [returnInfo setObject:floorPlan.floorPlanId forKey:@"id"];
        [returnInfo setObject:floorPlan.name forKey:@"name"];
        [returnInfo setObject:[floorPlan.imageUrl absoluteString] forKey:@"url"];
        [returnInfo setObject:[NSNumber numberWithInteger:floorPlan.floor.level] forKey:@"floorLevel"];
        [returnInfo setObject:[NSNumber numberWithDouble: floorPlan.bearing] forKey:@"bearing"];
        [returnInfo setObject:[NSNumber numberWithInteger:floorPlan.height] forKey:@"bitmapHeight"];
        [returnInfo setObject:[NSNumber numberWithInteger:floorPlan.width] forKey:@"bitmapWidth"];
        [returnInfo setObject:[NSNumber numberWithFloat:floorPlan.heightMeters] forKey:@"heightMeters"];
        [returnInfo setObject:[NSNumber numberWithFloat:floorPlan.widthMeters] forKey:@"widthMeters"];
        [returnInfo setObject:[NSNumber numberWithFloat:floorPlan.meterToPixelConversion] forKey:@"metersToPixels"];
        [returnInfo setObject:[NSNumber numberWithFloat:floorPlan.pixelToMeterConversion] forKey:@"pixelsToMeters"];
        CLLocationCoordinate2D locationPoint = floorPlan.bottomLeft;
        [returnInfo setObject:[NSArray arrayWithObjects:[NSNumber numberWithDouble:locationPoint.longitude],[NSNumber numberWithDouble:locationPoint.latitude], nil] forKey:@"bottomLeft"];
        locationPoint = floorPlan.center;
        [returnInfo setObject:[NSArray arrayWithObjects:[NSNumber numberWithDouble:locationPoint.longitude],[NSNumber numberWithDouble:locationPoint.latitude], nil] forKey:@"center"];
        locationPoint = floorPlan.topLeft;
        [returnInfo setObject:[NSArray arrayWithObjects:[NSNumber numberWithDouble:locationPoint.longitude],[NSNumber numberWithDouble:locationPoint.latitude], nil] forKey:@"topLeft"];
        locationPoint = floorPlan.topRight;
        [returnInfo setObject:[NSArray arrayWithObjects:[NSNumber numberWithDouble:locationPoint.longitude],[NSNumber numberWithDouble:locationPoint.latitude], nil] forKey:@"topRight"];

        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:returnInfo];
        [self.commandDelegate sendPluginResult:result callbackId:self.floorPlanCallbackID];
    }
}

-(void)location:(IndoorAtlasLocationService *)manager didFloorPlanFailedWithError:(NSError *)error
{
    NSLog(@"locationManager::didFloorPlanFailedWithError %@", [error localizedFailureReason]);
    if (self.floorPlanCallbackID != nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithUnsignedInteger:FLOORPLAN_UNAVAILABLE] forKey:@"code"];
        [posError setObject:[error localizedDescription] ? [error localizedDescription]:@"" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];

        [self.commandDelegate sendPluginResult:result callbackId:self.floorPlanCallbackID];
    }
}

- (void)errorInCoordinateToPoint:(NSError *) error
{
    NSLog(@"locationManager::didFloorPlanFailedWithError %@", [error localizedFailureReason]);
    if (self.coordinateToPointCallbackID != nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithUnsignedInteger:FLOORPLAN_UNAVAILABLE] forKey:@"code"];
        [posError setObject:[error localizedDescription] ? [error localizedDescription]:@"" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];

        [self.commandDelegate sendPluginResult:result callbackId:self.coordinateToPointCallbackID];
    }
}
- (void)errorInPointToCoordinate:(NSError *) error
{
    NSLog(@"locationManager::didFloorPlanFailedWithError %@", [error localizedFailureReason]);
    if (self.pointToCoordinateCallbackID != nil) {
        NSMutableDictionary* posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithUnsignedInteger:FLOORPLAN_UNAVAILABLE] forKey:@"code"];
        [posError setObject:[error localizedDescription] ? [error localizedDescription]:@"" forKey:@"message"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];

        [self.commandDelegate sendPluginResult:result callbackId:self.pointToCoordinateCallbackID];
    }
}
@end
