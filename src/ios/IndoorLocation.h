
#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <Cordova/CDVPlugin.h>
#import "IndoorAtlasLocationService.h"

enum IndoorLocationStatus {
    PERMISSION_DENIED = 1,
    POSITION_UNAVAILABLE,
    TIMEOUT,
    INVALID_ACCESS_TOKEN,
    INITIALIZATION_ERROR,
    FLOORPLAN_UNAVAILABLE,
    UNSPECIFIED_ERROR
};

enum IACurrentStatus {
    STATUS_OUT_OF_SERVICE = 0,
    STATUS_TEMPORARILY_UNAVAILABLE = 1,
    STATUS_AVAILABLE = 2,
    STATUS_LIMITED = 10
};
typedef NSUInteger IndoorLocationStatus;

// simple object to keep track of location information
@interface IndoorLocationInfo : NSObject {
}

@property (nonatomic, assign) IndoorLocationStatus locationStatus;
@property (nonatomic, strong) CLLocation *locationInfo;
@property (nonatomic, strong) IARegion *region;
@property (nonatomic, strong) NSNumber *floorID;
@property (nonatomic, strong) NSNumber *floorCertainty;
@property (nonatomic, strong) NSMutableArray *locationCallbacks;
@property (nonatomic, strong) NSMutableDictionary *watchCallbacks;

@end

// simple object to keep track of location information
@interface IndoorRegionInfo : NSObject {

}
@property (nonatomic, assign) IndoorLocationTransitionType regionStatus;
@property (nonatomic, strong) IARegion *region;
@property (nonatomic, strong) NSMutableDictionary *watchCallbacks;

@end

@interface IndoorLocation : CDVPlugin {
}

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) IndoorLocationInfo *locationData;
@property (nonatomic, strong) IndoorRegionInfo *regionData;
@property (nonatomic, strong) NSMutableArray *wayfinderInstances;

- (void)initializeIndoorAtlas:(CDVInvokedUrlCommand *)command;
- (void)getLocation:(CDVInvokedUrlCommand *)command;
- (void)addWatch:(CDVInvokedUrlCommand *)command;
- (void)clearWatch:(CDVInvokedUrlCommand *)command;
- (void)addRegionWatch:(CDVInvokedUrlCommand *)command;
- (void)clearRegionWatch:(CDVInvokedUrlCommand *)command;
- (void)addAttitudeCallback:(CDVInvokedUrlCommand *)command;
- (void)removeAttitudeCallback:(CDVInvokedUrlCommand *)command;
- (void)addHeadingCallback:(CDVInvokedUrlCommand *)command;
- (void)removeHeadingCallback:(CDVInvokedUrlCommand *)command;
- (void)removeRouteCallback:(CDVInvokedUrlCommand *)command;
- (void)addStatusChangedCallback:(CDVInvokedUrlCommand *)command;
- (void)removeStatusCallback:(CDVInvokedUrlCommand *)command;
- (void)setPosition:(CDVInvokedUrlCommand *)command;
- (void)setDistanceFilter:(CDVInvokedUrlCommand *)command;
- (void)getFloorCertainty:(CDVInvokedUrlCommand *)command;
- (void)getTraceId:(CDVInvokedUrlCommand *)command;
- (void)setSensitivities:(CDVInvokedUrlCommand *)command;
- (void)requestWayfindingUpdates:(CDVInvokedUrlCommand *)command;
- (void)removeWayfindingUpdates:(CDVInvokedUrlCommand *)command;
- (void)lockFloor:(CDVInvokedUrlCommand *)command;
- (void)unlockFloor:(CDVInvokedUrlCommand *)command;
- (void)lockIndoors:(CDVInvokedUrlCommand *)command;
@end
