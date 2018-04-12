
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
 *  Return Information about given Floor Refrence
 *
 *  @param manager   The location manager object that generated the event
 *  @param floorPlan Information about FloorPlan
 */
- (void)location:(IndoorAtlasLocationService *)manager withFloorPlan:(IAFloorPlan *)floorPlan callbackId:(NSString *)callbackId;

/**
 *  Return Error Information if unable to fetch Floorplan Info from server
 *
 *  @param manager
 *  @param error
 */
- (void)location:(IndoorAtlasLocationService *)manager didFloorPlanFailedWithError:(NSError *)error;

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
 *  UpdatedHeading callback
 *
 *  @param manager
 *  @param newHeading
 */
- (void)location:(IndoorAtlasLocationService *)manager didUpdateHeading:(IAHeading *)newHeading;
/**
 * Passes the calculated point to the Javascript side
 *
 * @param point
 */
- (void)sendCoordinateToPoint:(CGPoint)point;

/**
 * Passes the calculated coordinate to the Javascript side
 *
 * @param coords
 */
- (void)sendPointToCoordinate:(CLLocationCoordinate2D)coords;

- (void)errorInCoordinateToPoint:(NSError *) error;
- (void)errorInPointToCoordinate:(NSError *) error;

@end
@interface IndoorAtlasLocationService : NSObject{

}

@property (nonatomic, weak) id <IALocationDelegate> delegate;

- (id)init:(NSString *)apikey hash:(NSString *)apisecret;
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
 *  State is service active or not
 *
 *  @return YES/NO
 */
-(BOOL)isServiceActive;

/**
 *  Set explicit floor plan
 */
- (void)setFloorPlan:(NSString *)floorPlanId;

/**
 *  Set explicit location
 */
- (void)setLocation:(CLLocation *)location;

/**
 *  Set explicit venue
 */
- (void)setVenue:(NSString *)venueId;

/**
 *  Fetch Floorplan With Id
 *
 *  @param floorplanId
 */
- (void)fetchFloorplanWithId:(NSString *)floorplanId callbackId:(NSString *)callbackId;

/**
 * Calculates point with the given coordinates
 *
 * @param coords
 */
- (void)getCoordinateToPoint:(NSString *)floorplanId andCoordinates: (CLLocationCoordinate2D) coords;

/**
 * Calculates coordinates with the given point
 *
 * @param point
 */
- (void)getPointToCoordinate:(NSString *)floorplanId andPoint: (CGPoint) point;

- (void)valueForDistanceFilter:(float *)distance;
- (float)fetchFloorCertainty;
- (NSString *)fetchTraceId;
- (void)setSensitivities:(double *)orientationSensitivity headingSensitivity:(double *)headingSensitivity;

@end
