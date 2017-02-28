
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
typedef NSUInteger IndoorLocationStatus;

// simple object to keep track of location information
@interface IndoorLocationInfo : NSObject {
}

@property (nonatomic, assign) IndoorLocationStatus locationStatus;
@property (nonatomic, strong) CLLocation* locationInfo;
@property (nonatomic,strong)  IARegion *region;
@property (nonatomic, strong) NSString* floorID;
@property (nonatomic, strong) NSMutableArray* locationCallbacks;
@property (nonatomic, strong) NSMutableDictionary* watchCallbacks;

@end

// simple object to keep track of location information
@interface IndoorRegionInfo : NSObject {

}
@property (nonatomic, assign) IndoorLocationTransitionType regionStatus;
@property (nonatomic,strong)  IARegion *region;
@property (nonatomic, strong) NSMutableDictionary* watchCallbacks;

@end


@interface IndoorLocation : CDVPlugin{
}

@property (nonatomic, strong) CLLocationManager* locationManager;
@property (nonatomic, strong) IndoorLocationInfo* locationData;
@property (nonatomic, strong) IndoorRegionInfo* regionData;

- (void)initializeIndoorAtlas:(CDVInvokedUrlCommand*)command;
- (void)getLocation:(CDVInvokedUrlCommand*)command;
- (void)addWatch:(CDVInvokedUrlCommand*)command;
- (void)clearWatch:(CDVInvokedUrlCommand*)command;
- (void)addRegionWatch:(CDVInvokedUrlCommand*)command;
- (void)clearRegionWatch:(CDVInvokedUrlCommand*)command;
- (void)setPosition:(CDVInvokedUrlCommand*)command;
- (void)fetchFloorplan:(CDVInvokedUrlCommand*)command;
- (void)coordinateToPoint:(CDVInvokedUrlCommand*)command;
- (void)pointToCoordinate:(CDVInvokedUrlCommand*)command;
- (void)sendCoordinateToPoint:(CGPoint)point;
- (void)sendPointToCoordinate:(CLLocationCoordinate2D)coords;
- (void)setDistanceFilter:(CDVInvokedUrlCommand*)command;
- (void)getFloorCertainty:(CDVInvokedUrlCommand*)command;
- (void)getTraceId:(CDVInvokedUrlCommand*)command;

@end
