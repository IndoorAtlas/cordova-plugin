#import "IndoorLocation.h"
#pragma mark IndoorLocationInfo

@implementation IndoorLocationInfo

- (IndoorLocationInfo *)init
{
    self = (IndoorLocationInfo *)[super init];
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

- (IndoorRegionInfo *)init
{
    self = (IndoorRegionInfo *)[super init];
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

@property (nonatomic, strong) IndoorAtlasLocationService *IAlocationInfo;
@property (nonatomic, strong) NSString *floorPlanCallbackID;
@property (nonatomic, strong) NSString *coordinateToPointCallbackID;
@property (nonatomic, strong) NSString *pointToCoordinateCallbackID;
@property (nonatomic, strong) NSString *setDistanceFilterCallbackID;
@property (nonatomic, strong) NSString *getFloorCertaintyCallbackID;
@property (nonatomic, strong) NSString *getTraceIdCallbackID;
@property (nonatomic, strong) NSString *addAttitudeUpdateCallbackID;
@property (nonatomic, strong) NSString *addHeadingUpdateCallbackID;
@property (nonatomic, strong) NSString *addStatusUpdateCallbackID;
@property (nonatomic, strong) NSString *addRouteUpdateCallbackID;
@property (nonatomic, strong) NSString *addGeofenceUpdateCallbackID;

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

- (void)startLocation
{
    __locationStarted = YES;
    [self.IAlocationInfo startPositioning];
}

- (void)_stopLocation
{
    BOOL stopLocationservice = YES;

    if(self.locationData && (self.locationData.watchCallbacks.count > 0 ||self.locationData.locationCallbacks.count > 0)) {
        stopLocationservice = NO;
    }
    else if(self.regionData && self.regionData.watchCallbacks.count > 0) {
        stopLocationservice = NO;
    }
    if (stopLocationservice) {
        if (__locationStarted) {
            [self.locationManager stopUpdatingLocation];
            __locationStarted = NO;
        }
        [self.IAlocationInfo stopPositioning];
    }
}

- (void)returnLocationInfo:(NSString *)callbackId andKeepCallback:(BOOL)keepCallback
{
    CDVPluginResult *result = nil;
    IndoorLocationInfo *lData = self.locationData;

    if (lData && !lData.locationInfo) {
        // return error
        NSMutableDictionary *posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:POSITION_UNAVAILABLE] forKey:@"code"];
        [posError setObject:@"Position not available" forKey:@"message"];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
    } else if (lData && lData.locationInfo) {
        CLLocation *lInfo = lData.locationInfo;
        NSMutableDictionary *returnInfo = [NSMutableDictionary dictionaryWithCapacity:10];
        NSNumber *timestamp = [NSNumber numberWithDouble:([lInfo.timestamp timeIntervalSince1970] * 1000)];
        [returnInfo setObject:timestamp forKey:@"timestamp"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.speed] forKey:@"velocity"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.verticalAccuracy] forKey:@"altitudeAccuracy"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.horizontalAccuracy] forKey:@"accuracy"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.course] forKey:@"heading"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.altitude] forKey:@"altitude"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.coordinate.latitude] forKey:@"latitude"];
        [returnInfo setObject:[NSNumber numberWithDouble:lInfo.coordinate.longitude] forKey:@"longitude"];

        [returnInfo setObject:lData.floorID forKey:@"flr"];
        [returnInfo setObject:lData.floorCertainty forKey:@"floorCertainty"];
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

- (void)returnRegionInfo:(NSString *)callbackId andKeepCallback:(BOOL)keepCallback
{
    CDVPluginResult *result = nil;
    IndoorRegionInfo *lData = self.regionData;

    if (lData && !lData.region) {
        // return error
        NSMutableDictionary *posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:POSITION_UNAVAILABLE] forKey:@"code"];
        [posError setObject:@"Region not available" forKey:@"message"];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
    } else if (lData && lData.region) {
        NSMutableDictionary *returnInfo = [NSMutableDictionary dictionaryWithDictionary:[self formatRegionInfo:lData.region andTransitionType:lData.regionStatus]];
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:returnInfo];
        [result setKeepCallbackAsBool:keepCallback];
    }
    if (result) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }
}

- (void)returnLocationError:(NSUInteger)errorCode withMessage:(NSString *)message
{
    NSMutableDictionary *posError = [NSMutableDictionary dictionaryWithCapacity:2];

    [posError setObject:[NSNumber numberWithUnsignedInteger:errorCode] forKey:@"code"];
    [posError setObject:message ? message:@"" forKey:@"message"];
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];

    for (NSString *callbackId in self.locationData.locationCallbacks) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }

    [self.locationData.locationCallbacks removeAllObjects];

    for (NSString *callbackId in self.locationData.watchCallbacks) {
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
    }
}

- (void)returnAttitudeInformation:(double)x y:(double)y z:(double)z w:(double)w timestamp:(NSDate *)timestamp
{
    if (_addAttitudeUpdateCallbackID != nil) {
        CDVPluginResult *pluginResult;

        NSNumber *secondsSinceRefDate = [NSNumber numberWithDouble:[timestamp timeIntervalSinceReferenceDate]];
        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:5];
        [result setObject:secondsSinceRefDate forKey:@"timestamp"];
        [result setObject:[NSNumber numberWithDouble:x] forKey:@"x"];
        [result setObject:[NSNumber numberWithDouble:y] forKey:@"y"];
        [result setObject:[NSNumber numberWithDouble:z] forKey:@"z"];
        [result setObject:[NSNumber numberWithDouble:w] forKey:@"w"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.addAttitudeUpdateCallbackID];
    }
}

- (void)returnHeadingInformation:(double)heading timestamp:(NSDate *)timestamp
{
    if (_addHeadingUpdateCallbackID != nil) {
        CDVPluginResult *pluginResult;

        NSNumber *secondsSinceRefDate = [NSNumber numberWithDouble:[timestamp timeIntervalSinceReferenceDate]];
        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:secondsSinceRefDate forKey:@"timestamp"];
        [result setObject:[NSNumber numberWithDouble:heading] forKey:@"trueHeading"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.addHeadingUpdateCallbackID];
    }
}

- (void)returnRouteInformation:(IARoute *)route
{
    if (_addRouteUpdateCallbackID == nil) {
        NSLog(@"No wayfinding callback found");
        return;
    }

    NSMutableArray<NSDictionary *>* routingLegs = [[NSMutableArray alloc] init];
    for (int i = 0; i < [route.legs count]; i++) {
        [routingLegs addObject:[self dictionaryFromRouteLeg:route.legs[i]]];
    }
    NSDictionary *result = @{@"legs": routingLegs};

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
    [pluginResult setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.addRouteUpdateCallbackID];
}

- (void)returnStatusInformation:(NSString *)statusString code:(NSUInteger) code
{
    if (_addStatusUpdateCallbackID != nil) {
        CDVPluginResult *pluginResult;

        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:statusString forKey:@"message"];
        [result setObject:[NSNumber numberWithUnsignedInteger:code] forKey:@"code"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.addStatusUpdateCallbackID];
    }
}

- (NSDictionary *)formatRegionInfo:(IARegion *)regionInfo andTransitionType:(IndoorLocationTransitionType)transitionType
{
    NSMutableDictionary *result = [@{@"regionId": regionInfo.identifier,
                                     @"timestamp": [NSNumber numberWithDouble:([regionInfo.timestamp timeIntervalSince1970] * 1000)],
                                     @"regionType": [NSNumber numberWithInt:regionInfo.type],
                                     @"transitionType": [NSNumber numberWithInteger:transitionType]
                                     } mutableCopy];

    if (regionInfo.venue != nil) {
        NSMutableDictionary *venue = [@{@"id": regionInfo.venue.id,
                                        @"name": regionInfo.venue.name
                                        } mutableCopy];

        NSMutableArray *floorplans = [[NSMutableArray alloc] initWithCapacity:regionInfo.venue.floorplans.count];
        for (size_t i = 0; i < regionInfo.venue.floorplans.count; i++) {
            [floorplans addObject:[self floorPlanToDictionary:[regionInfo.venue.floorplans objectAtIndex:i]]];
        }
        [venue setObject:floorplans forKey:@"floorPlans"];
        NSMutableArray *geofences = [[NSMutableArray alloc] initWithCapacity:regionInfo.venue.geofences.count];
        for (size_t i = 0; i < regionInfo.venue.geofences.count; i++) {
            [geofences addObject:[self dictionaryFromGeofence:[regionInfo.venue.geofences objectAtIndex:i]]];
        }
        [venue setObject:geofences forKey:@"geofences"];
        NSMutableArray *pois = [[NSMutableArray alloc] initWithCapacity:regionInfo.venue.pois.count];
        for (size_t i = 0; i < regionInfo.venue.pois.count; i++) {
            [pois addObject:[self dictionaryFromPoi:[regionInfo.venue.pois objectAtIndex:i]]];
        }
        [venue setObject:pois forKey:@"pois"];
        [result setObject:venue forKey:@"venue"];
    }
    if (regionInfo.floorplan != nil) {
        [result setObject:[self floorPlanToDictionary:regionInfo.floorplan] forKey:@"floorPlan"];
    }
    return result;
}

- (NSDictionary *)floorPlanToDictionary:(IAFloorPlan *)floorplan
{
    NSMutableDictionary *dict = [@{@"id": floorplan.floorPlanId,
                           @"name": floorplan.name,
                           @"url": floorplan.imageUrl.absoluteString,
                           @"bearing": @(floorplan.bearing),
                           @"bitmapHeight": @(floorplan.height),
                           @"bitmapWidth": @(floorplan.width),
                           @"heightMeters": @(floorplan.heightMeters),
                           @"widthMeters": @(floorplan.widthMeters),
                           @"metersToPixels": @(floorplan.meterToPixelConversion),
                           @"pixelsToMeters": @(floorplan.pixelToMeterConversion),
                           @"bottomLeft": @[@(floorplan.bottomLeft.longitude), @(floorplan.bottomLeft.latitude)],
                           @"center": @[@(floorplan.center.longitude), @(floorplan.center.latitude)],
                           @"topLeft": @[@(floorplan.topLeft.longitude), @(floorplan.topLeft.latitude)],
                           @"topRight": @[@(floorplan.topRight.longitude), @(floorplan.topRight.latitude)],
                           } mutableCopy];
    if (floorplan.floor) {
        [dict setObject:[NSNumber numberWithInteger:floorplan.floor.level] forKey:@"floorLevel"];
    }

    return dict;
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

- (void)initializeIndoorAtlas:(CDVInvokedUrlCommand *)command
{
    NSString *callbackId = command.callbackId;
    CDVPluginResult *pluginResult;
    NSString *iakey = [command.arguments objectAtIndex:0];

    if (iakey == nil) {
        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [result setObject:@"Invalid access token" forKey:@"message"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:result];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }
    else {
        self.IAlocationInfo = [[IndoorAtlasLocationService alloc] init:iakey];
        self.IAlocationInfo.delegate = self;

        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:[NSNumber numberWithInt:0] forKey:@"code"];
        [result setObject:@"service Initialize" forKey:@"message"];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
    }

}

- (void)getLocation:(CDVInvokedUrlCommand *)command
{
    NSString *callbackId = command.callbackId;
    if (self.IAlocationInfo == nil) {
        NSMutableDictionary *posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
        return;
    }

    if (!self.locationData) {
       self.locationData = [[IndoorLocationInfo alloc] init];
    }
    IndoorLocationInfo *lData = self.locationData;
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

- (void)addWatch:(CDVInvokedUrlCommand *)command
{
    NSString *callbackId = command.callbackId;
    if (self.IAlocationInfo == nil) {
        NSMutableDictionary *posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
        return;
    }
    NSString *timerId = [command argumentAtIndex:0];

    if (!self.locationData) {
        self.locationData = [[IndoorLocationInfo alloc] init];
    }
    IndoorLocationInfo *lData = self.locationData;

    if (!lData.watchCallbacks) {
        lData.watchCallbacks = [NSMutableDictionary dictionaryWithCapacity:1];
    }

    // add the callbackId into the dictionary so we can call back whenever get data
    [lData.watchCallbacks setObject:callbackId forKey:timerId];

    if (!__locationStarted) {
       // Tell the location manager to start notifying us of location updates
       [self startLocation];
    }
}

- (void)clearWatch:(CDVInvokedUrlCommand *)command
{
    NSString *timerId = [command argumentAtIndex:0];

    if (self.locationData && self.locationData.watchCallbacks && [self.locationData.watchCallbacks objectForKey:timerId]) {
        [self.locationData.watchCallbacks removeObjectForKey:timerId];
        if([self.locationData.watchCallbacks count] == 0) {
            [self _stopLocation];
        }
    }
}

- (void)addRegionWatch:(CDVInvokedUrlCommand *)command
{
    NSString *callbackId = command.callbackId;
    if (self.IAlocationInfo == nil) {
        NSMutableDictionary *posError = [NSMutableDictionary dictionaryWithCapacity:2];
        [posError setObject:[NSNumber numberWithInt:INVALID_ACCESS_TOKEN] forKey:@"code"];
        [posError setObject:@"Invalid access token" forKey:@"message"];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:posError];
        [self.commandDelegate sendPluginResult:result callbackId:callbackId];
        return;
    }
    NSString *timerId = [command argumentAtIndex:0];

    if (!self.regionData) {
        self.regionData = [[IndoorRegionInfo alloc] init];
    }
    IndoorRegionInfo *lData = self.regionData;

    if (!lData.watchCallbacks) {
        lData.watchCallbacks = [NSMutableDictionary dictionaryWithCapacity:1];
    }

    // add the callbackId into the dictionary so we can call back whenever get data
    [lData.watchCallbacks setObject:callbackId forKey:timerId];

    if (!__locationStarted) {
       // Tell the location manager to start notifying us of location updates
       [self startLocation];
    }
}

- (void)clearRegionWatch:(CDVInvokedUrlCommand *)command
{
    NSString *timerId = [command argumentAtIndex:0];

    if (self.regionData && self.regionData.watchCallbacks && [self.regionData.watchCallbacks objectForKey:timerId]) {
        [self.regionData.watchCallbacks removeObjectForKey:timerId];
        if([self.regionData.watchCallbacks count] == 0) {
            [self _stopLocation];
        }
    }
}

- (void)addAttitudeCallback:(CDVInvokedUrlCommand *)command
{
    _addAttitudeUpdateCallbackID = command.callbackId;
}

- (void)removeAttitudeCallback:(CDVInvokedUrlCommand *)command
{
    _addAttitudeUpdateCallbackID = nil;
}

- (void)addHeadingCallback:(CDVInvokedUrlCommand *)command
{
    _addHeadingUpdateCallbackID = command.callbackId;
}

- (void)removeHeadingCallback:(CDVInvokedUrlCommand *)command
{
    _addHeadingUpdateCallbackID = nil;
}

- (void)removeRouteCallback:(CDVInvokedUrlCommand *)command
{
    _addRouteUpdateCallbackID = nil;
}

- (void)addStatusChangedCallback:(CDVInvokedUrlCommand *)command
{
    _addStatusUpdateCallbackID = command.callbackId;
}

- (void)removeStatusCallback:(CDVInvokedUrlCommand *)command
{
    _addStatusUpdateCallbackID = nil;
}

- (void)stopLocation:(CDVInvokedUrlCommand *)command
{
    [self _stopLocation];
}

- (void)setPosition:(CDVInvokedUrlCommand *)command
{
    NSString *oLat = [command argumentAtIndex:0];
    NSString *oLon = [command argumentAtIndex:1];
    NSString *oFloor = [command argumentAtIndex:2];
    NSString *oAcc = [command argumentAtIndex:3];
    NSLog(@"locationManager::setPosition:: %@, %@, %@, %@", oLat, oLon, oFloor, oAcc);

    const double lat = [oLat doubleValue];
    const double lon = [oLon doubleValue];
    CLLocation *loc = [[CLLocation alloc] initWithLatitude:lat longitude:lon];
    if (oAcc) {
        const double acc = [oAcc doubleValue];
        [loc setValue: [NSNumber numberWithDouble:acc] forKey:@"horizontalAccuracy"];
    }
    IALocation *iaLoc;
    if (oFloor) {
        const int floor = [oFloor intValue];
        iaLoc = [IALocation locationWithCLLocation:loc andFloor: [IAFloor floorWithLevel:floor]];
    } else {
        iaLoc = [IALocation locationWithCLLocation:loc];
    }
    [self.IAlocationInfo setPosition:iaLoc];
}

- (void)setDistanceFilter:(CDVInvokedUrlCommand *)command
{
    self.setDistanceFilterCallbackID = command.callbackId;
    NSString *distance = [command argumentAtIndex:0];

    float d = [distance floatValue];
    [self.IAlocationInfo valueForDistanceFilter: &d];

    CDVPluginResult *pluginResult;
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:1];
    [result setObject:@"DistanceFilter set" forKey:@"message"];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.setDistanceFilterCallbackID];
}

- (void)getFloorCertainty:(CDVInvokedUrlCommand *)command
{
  self.getFloorCertaintyCallbackID = command.callbackId;
  float certainty = [self.IAlocationInfo fetchFloorCertainty];

  CDVPluginResult *pluginResult;
  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:1];
  [result setObject:[NSNumber numberWithFloat:certainty] forKey:@"floorCertainty"];

  pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
  [self.commandDelegate sendPluginResult:pluginResult callbackId:self.getFloorCertaintyCallbackID];
}

- (void)getTraceId:(CDVInvokedUrlCommand *)command
{
  self.getTraceIdCallbackID = command.callbackId;
  NSString *traceId = [self.IAlocationInfo fetchTraceId];

  CDVPluginResult *pluginResult;
  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:1];
  [result setObject:traceId forKey:@"traceId"];

  pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
  [self.commandDelegate sendPluginResult:pluginResult callbackId:self.getTraceIdCallbackID];
}

- (void)setSensitivities:(CDVInvokedUrlCommand *)command
{
    NSString *oSensitivity = [command argumentAtIndex:0];
    NSString *hSensitivity = [command argumentAtIndex:1];

    double orientationSensitivity = [oSensitivity doubleValue];
    double headingSensitivity = [hSensitivity doubleValue];

    [self.IAlocationInfo setSensitivities: &orientationSensitivity headingSensitivity:&headingSensitivity];

    CDVPluginResult *pluginResult;
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:1];
    [result setObject:@"Sensitivities set" forKey:@"message"];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)requestWayfindingUpdates:(CDVInvokedUrlCommand *)command
{
    NSString *oLat = [command argumentAtIndex:0];
    NSString *oLon = [command argumentAtIndex:1];
    NSString *oFloor = [command argumentAtIndex:2];
    self.addRouteUpdateCallbackID = command.callbackId;

    const double lat = [oLat doubleValue];
    const double lon = [oLon doubleValue];
    const int floor = [oFloor intValue];

    NSLog(@"locationManager::requestWayfindingUpdates %f, %f, %d", lat, lon, floor);
    IAWayfindingRequest *req = [IAWayfindingRequest alloc];
    req.coordinate = CLLocationCoordinate2DMake(lat, lon);
    req.floor = floor;
    [self.IAlocationInfo startMonitoringForWayfinding:req];
}

- (void)removeWayfindingUpdates:(CDVInvokedUrlCommand *)command
{
    [self.IAlocationInfo stopMonitoringForWayfinding];
}

- (IAPolygonGeofence *)geofenceFromDictionary:(NSDictionary *)geofence {

    NSDictionary *geometry = [geofence objectForKey:@"geometry"];
    NSArray *coordinates = [geometry valueForKey:@"coordinates"];
    NSArray *linearRing = coordinates[0];
    NSMutableArray *points = [[NSMutableArray alloc] init];
    for (int i = 0; i < [linearRing count]; i++) {
        NSArray *vertex = linearRing[i];
        [points addObject:vertex[1]];
        [points addObject:vertex[0]];
    }
    NSDictionary *properties = [geofence objectForKey:@"properties"];

    IAFloor *iaFloor = [IAFloor floorWithLevel:[[properties valueForKey:@"floor"] integerValue]];
    IAPolygonGeofence *iaGeofence = [
        IAPolygonGeofence
            polygonGeofenceWithIdentifier:[geofence objectForKey:@"id"]
            andFloor:iaFloor
            edges:points
        ];
    iaGeofence.name = [properties objectForKey:@"name"];
    iaGeofence.payload = [properties objectForKey:@"payload"];
    return iaGeofence;
}

- (NSDictionary *)dictionaryFromGeofence:(IAGeofence *)iaGeofence
{
    NSMutableDictionary *geoJson = [NSMutableDictionary dictionaryWithCapacity:4];
    [geoJson setObject:@"Feature" forKey:@"type"];
    [geoJson setObject:iaGeofence.identifier forKey:@"id"];

    NSMutableDictionary *properties = [NSMutableDictionary dictionaryWithCapacity:2];
    [properties setObject:iaGeofence.name forKey:@"name"];
    [properties setObject:[NSNumber numberWithInt:iaGeofence.floor.level] forKey:@"floor"];
    if (iaGeofence.payload != nil) {
        [properties setObject:iaGeofence.payload forKey:@"payload"];
    }
    [geoJson setObject:properties forKey:@"properties"];

    NSMutableDictionary *geometry = [NSMutableDictionary dictionaryWithCapacity:2];
    [geometry setObject:@"Polygon" forKey:@"type"];
    NSMutableArray *coordinates = [[NSMutableArray alloc] init];
    NSMutableArray *linearRing = [[NSMutableArray alloc] init];
    for (int i = 0; i < [iaGeofence.points count]; i += 2) {
        NSMutableArray *vertex = [[NSMutableArray alloc] init];
        [vertex addObject:iaGeofence.points[i + 1]];
        [vertex addObject:iaGeofence.points[i]];
        [linearRing addObject:vertex];
    }
    [coordinates addObject:linearRing];
    [geometry setObject:coordinates forKey:@"coordinates"];

    [geoJson setObject:geometry forKey:@"geometry"];

    return geoJson;
}

- (NSDictionary *)dictionaryFromPoi:(IAPOI *)iaPoi
{
    NSMutableDictionary *poi = [NSMutableDictionary dictionaryWithCapacity:4];
    [poi setObject:@"Feature" forKey:@"type"];
    [poi setObject:iaPoi.identifier forKey:@"id"];

    NSMutableDictionary *properties = [NSMutableDictionary dictionaryWithCapacity:3];
    [properties setObject:iaPoi.name forKey:@"name"];
    [properties setObject:[NSNumber numberWithInt:iaPoi.floor.level] forKey:@"floor"];
    if (iaPoi.payload != nil) {
        [properties setObject:iaPoi.payload forKey:@"payload"];
    }
    [poi setObject:properties forKey:@"properties"];

    NSMutableDictionary *geometry = [NSMutableDictionary dictionaryWithCapacity:2];
    [geometry setObject:@"Point" forKey:@"type"];
    NSMutableArray *coordinates = [[NSMutableArray alloc] init];
    [coordinates addObject:[NSNumber numberWithDouble:iaPoi.coordinate.longitude]];
    [coordinates addObject:[NSNumber numberWithDouble:iaPoi.coordinate.latitude]];
    [geometry setObject:coordinates forKey:@"coordinates"];

    [poi setObject:geometry forKey:@"geometry"];

    return poi;
}

- (void)watchGeofences:(CDVInvokedUrlCommand *)command
{
    self.addGeofenceUpdateCallbackID = command.callbackId;
}

- (void)clearGeofenceWatch:(CDVInvokedUrlCommand *)command
{
    self.addGeofenceUpdateCallbackID = nil;
}

- (void)addDynamicGeofence:(CDVInvokedUrlCommand *)command
{
    NSDictionary *geoJson = [command argumentAtIndex:0];
    IAPolygonGeofence *iaGeofence = [self geofenceFromDictionary:geoJson];
    [self.IAlocationInfo startMonitoringGeofences:iaGeofence];
}

- (void)removeDynamicGeofence:(CDVInvokedUrlCommand *)command
{
    NSDictionary *geoJson = [command argumentAtIndex:0];
    IAPolygonGeofence *iaGeofence = [self geofenceFromDictionary:geoJson];
    [self.IAlocationInfo stopMonitoringGeofences:iaGeofence];
}

- (void)lockFloor:(CDVInvokedUrlCommand *)command
{
    NSString *oFloor = [command argumentAtIndex:0];
    NSInteger floor = [oFloor integerValue];
    [self.IAlocationInfo setFloorLock:(int)floor];
}

- (void)unlockFloor:(CDVInvokedUrlCommand *)command
{
    [self.IAlocationInfo unlockFloor];
}

- (void)lockIndoors:(CDVInvokedUrlCommand *)command
{
    NSString *oIndoors = [command argumentAtIndex:0];
    bool indoors = [oIndoors boolValue];
    [self.IAlocationInfo lockIndoors:indoors];
}

/**
 * Create NSMutableDictionary from the RouteLeg object
 */
- (NSDictionary *)dictionaryFromRouteLeg:(IARouteLeg *)routeLeg {
    return @{@"begin": [self dictionaryFromRoutePoint:routeLeg.begin],
             @"end": [self dictionaryFromRoutePoint:routeLeg.end],
             @"length": @(routeLeg.length),
             @"direction": @(routeLeg.direction),
             @"edgeIndex": @(routeLeg.edgeIndex)
             };
}

/**
 * Create NSMutableDictionary from the RoutePoint object
 */
- (NSDictionary *)dictionaryFromRoutePoint:(IARoutePoint *)routePoint {
    return @{@"latitude": @(routePoint.coordinate.latitude),
             @"longitude": @(routePoint.coordinate.longitude),
             @"floor": @(routePoint.floor),
             @"nodeIndex": @(routePoint.nodeIndex)
             };
}

/**
 * Send error command back to JavaScript side
 */
- (void)sendErrorCommand:(CDVInvokedUrlCommand *)command withMessage:(NSString *)message
{
    CDVPluginResult *pluginResult;
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:message];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

#pragma mark IndoorAtlas Location
- (void)location:(IndoorAtlasLocationService *)manager didUpdateLocation:(IALocation *)newLocation
{
    IndoorLocationInfo *cData = self.locationData;

    cData.locationInfo = [[CLLocation alloc] initWithCoordinate:newLocation.location.coordinate altitude:0 horizontalAccuracy:newLocation.location.horizontalAccuracy verticalAccuracy:0 course:newLocation.location.course speed:0 timestamp:[NSDate date]];
    cData.floorID = [NSNumber numberWithInteger:newLocation.floor.level];
    cData.floorCertainty = [NSNumber numberWithFloat:newLocation.floor.certainty];
    cData.region = newLocation.region;
    if (self.locationData.locationCallbacks.count > 0) {
        for (NSString *callbackId in self.locationData.locationCallbacks) {
            [self returnLocationInfo:callbackId andKeepCallback:NO];
        }

        [self.locationData.locationCallbacks removeAllObjects];
    }
    if (self.locationData.watchCallbacks.count > 0) {
        for (NSString *timerId in self.locationData.watchCallbacks) {
            [self returnLocationInfo:[self.locationData.watchCallbacks objectForKey:timerId] andKeepCallback:YES];
        }
    } else {
        // No callbacks waiting on us anymore, turn off listening.
        [self _stopLocation];
    }
}

- (void)location:(IndoorAtlasLocationService *)manager didUpdateRoute:(nonnull IARoute *)route
{
    [self returnRouteInformation:route];
}

- (void)location:(IndoorAtlasLocationService *)manager didFailWithError:(NSError *)error
{
    NSLog(@"locationManager::didFailWithError %@", [error localizedFailureReason]);
    IndoorLocationInfo *lData = self.locationData;
    if (lData && __locationStarted) {
        // TODO: probably have to once over the various error codes and return one of:
        // PositionError.PERMISSION_DENIED = 1;
        // PositionError.POSITION_UNAVAILABLE = 2;
        // PositionError.TIMEOUT = 3;
        NSUInteger positionError = POSITION_UNAVAILABLE;
        [self returnLocationError:positionError withMessage:[error localizedDescription]];
    }
}

- (NSString *)getGeofenceTransitionType:(IndoorLocationTransitionType)enterOrExit
{
    if (enterOrExit == TRANSITION_TYPE_ENTER) {
        return @"ENTER";
    } else if (enterOrExit == TRANSITION_TYPE_EXIT) {
        return @"EXIT";
    } else {
        return @"UNKNOWN";
    }
}

- (void)location:(IndoorAtlasLocationService *)manager didRegionChange:(IARegion *)region type:(IndoorLocationTransitionType)enterOrExit
{
    if (region == nil) {
        return;
    }
    if (region.type == kIARegionTypeGeofence) {
        NSMutableDictionary *geofenceDict = [self dictionaryFromGeofence:region];
        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:2];
        [result setObject:geofenceDict forKey:@"geoJson"];
        [result setObject:[self getGeofenceTransitionType:enterOrExit] forKey:@"transitionType"];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        [pluginResult setKeepCallbackAsBool:YES];
        if (self.addGeofenceUpdateCallbackID) {
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.addGeofenceUpdateCallbackID];
        }
    } else {
        IndoorRegionInfo *cData = self.regionData;
        cData.region = region;
        cData.regionStatus = enterOrExit;
        if (self.regionData.watchCallbacks.count > 0) {
            for (NSString *timerId in self.regionData.watchCallbacks) {
                [self returnRegionInfo:[self.regionData.watchCallbacks objectForKey:timerId] andKeepCallback:YES];
            }
        } else {
            // No callbacks waiting on us anymore, turn off listening.
            [self _stopLocation];
        }
    }
}

- (void)location:(IndoorAtlasLocationService *)manager didUpdateAttitude:(IAAttitude *)attitude
{
    double x = attitude.quaternion.x;
    double y = attitude.quaternion.y;
    double z = attitude.quaternion.z;
    double w = attitude.quaternion.w;
    NSDate *timestamp = attitude.timestamp;

    [self returnAttitudeInformation:x y:y z:z w:w timestamp:timestamp];
}

- (void)location:(IndoorAtlasLocationService *)manager didUpdateHeading:(IAHeading *)heading
{
    double direction = heading.trueHeading;
    NSDate *timestamp = heading.timestamp;

    [self returnHeadingInformation:direction timestamp:timestamp];
}

- (void)location:(IndoorAtlasLocationService *)manager statusChanged:(IAStatus *)status
{
    NSString *statusDisplay;
    NSUInteger statusCode;
    switch (status.type) {
        case kIAStatusServiceAvailable:
            statusDisplay = @"Available";
            statusCode = STATUS_AVAILABLE;
            break;
        case kIAStatusServiceOutOfService:
            statusDisplay = @"Out of Service";
            statusCode = STATUS_OUT_OF_SERVICE;
            break;
        case kIAStatusServiceUnavailable:
            statusDisplay = @"Service Unavailable";
            statusCode = STATUS_TEMPORARILY_UNAVAILABLE;
            break;
        case kIAStatusServiceLimited:
            statusDisplay = @"Service Limited";
            statusCode = STATUS_LIMITED;
            break;
        default:
            statusDisplay = @"Unspecified Status";
            break;
    }

    [self returnStatusInformation:statusDisplay code:statusCode];
    NSLog(@"IALocationManager status %d %@", status.type, statusDisplay) ;
}
@end
