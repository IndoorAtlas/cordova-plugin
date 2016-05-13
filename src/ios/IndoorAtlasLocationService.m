
#import <UIKit/UIKit.h>
#import "IndoorAtlasLocationService.h"
#import <IndoorAtlas/IAResourceManager.h>



@interface IndoorAtlasLocationService()<IALocationManagerDelegate>{
    
    
}
@property (nonatomic, strong) IALocationManager *manager;
@property (nonatomic, strong) IAResourceManager *resourceManager;
@property (nonatomic, retain) NSString*   apikey;
@property (nonatomic, retain) NSString*   apiSecret;
@property (nonatomic, retain) NSString*   graphicID;
@end
@implementation IndoorAtlasLocationService{
    BOOL serviceStoped;
}


-(id)init{
    [NSException raise:@"API keys invalid" format:@"Missing IndoorAtlas Credential"];
    return nil;
}

/**
 *  IndoorAalas Navigation
 *
 *  @param apikey    Indoor atlas key
 *  @param apisecret IndoorAtlas secret
 *
 *  @return Object for indoor navigation
 */
-(id)init:(NSString *)apikey hash:(NSString *)apisecret{
    self = [super init];
    if (self) {
        self.apikey=apikey;
        self.apiSecret=apisecret;
        // Create IALocationManager and point delegate to receiver
        self.manager = [IALocationManager new];
        
        // Set IndoorAtlas API key and secret
        [self.manager setApiKey:self.apikey andSecret:self.apiSecret];
        
        self.manager.delegate = self;
        serviceStoped=YES;
        
        // Create floor plan manager
        self.resourceManager = [IAResourceManager resourceManagerWithLocationManager:self.manager];
        
    }
    return self;
}

#pragma mark IALocationManager delegate methods

/**
 *  Start indoor atlas service
 *
 *  @param floorid
 */
-(void)startPositioning:(NSString *)floorid{
    serviceStoped=NO;
    self.graphicID=floorid;
    [self setCriticalLog:[NSString stringWithFormat:@"Started service for floorid %@",self.graphicID]];
    [self.manager stopUpdatingLocation];
    if (self.graphicID!=nil) {
        IALocation *location = [IALocation locationWithFloorPlanId:self.graphicID];
        self.manager.location = location;
    }
    [self.manager startUpdatingLocation];
        
    
}

-(void)stopPositioning{
    serviceStoped=YES;
    [self.manager stopUpdatingLocation];
    [self setCriticalLog:@"Indoor Atlas service stoped"];
}



#pragma mark IndoorAtlasPositionerDelegate methods
/**
 * Tells the delegate that the user entered the specified region.
 * @param manager The location manager object that generated the event.
 * @param region The region related to event.
 */
- (void)indoorLocationManager:(nonnull IALocationManager*)manager didEnterRegion:(nonnull IARegion*)region{
    if([self.delegate respondsToSelector:@selector(location:didRegionChange:type:)]){
        [self.delegate location:self didRegionChange:region type:TRANSITION_TYPE_ENTER];
    }
}

/**
 * Tells the delegate that the user left the specified region.
 * @param manager The location manager object that generated the event.
 * @param region The region related to event.
 */
- (void)indoorLocationManager:(nonnull IALocationManager*)manager didExitRegion:(nonnull IARegion*)region{
        if([self.delegate respondsToSelector:@selector(location:didRegionChange:type:)]){
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
    IALocation* loc = [locations lastObject];
    IAFloor *floorID=[(IALocation*)locations.lastObject floor];
    if (floorID==nil) {
        NSLog(@"Invalid Floor");
        return;
    }
    
    if(self.delegate!=nil){
        [self.delegate location:self didUpdateLocation:loc];
    }
}
/**
 *  Error raised by Indooratlas SDK
 *
 *  @param manager
 *  @param status
 */
- (void)indoorLocationManager:(nonnull IALocationManager*)manager statusChanged:(nonnull IAStatus*)status{
    NSString *statusDisplay;
    switch (status.type) {
        case kIAStatusServiceAvailable:
            statusDisplay=@"Connected";
            break;
        case kIAStatusServiceOutOfService:
            statusDisplay=@"OutOfservice";
            if ([self.delegate respondsToSelector:@selector(location:didFailWithError:)]) {
                [self.delegate location:self didFailWithError:[NSError errorWithDomain:@"OutOfservice" code:kIAStatusServiceOutOfService userInfo:nil]];
            }
            break;
        case kIAStatusServiceUnavailable:
            if ([self.delegate respondsToSelector:@selector(location:didFailWithError:)]) {
                [self.delegate location:self didFailWithError:[NSError errorWithDomain:@"Service Unavailable" code:kIAStatusServiceUnavailable userInfo:nil]];
            }
            statusDisplay=@"Service Unavailable";
            break;
        case kIAStatusServiceLimited:
            statusDisplay=@"Service Limited";
            break;
        default:
            statusDisplay=@"Unknown";
            break;
    }
    NSLog(@"IALocationManager status %d %@",status.type, statusDisplay) ;
    
}
#pragma mark Resource Manager
/**
 * Fetch floor plan and image with ID
 * These methods are just wrappers around server requests.
 * You will need api key and secret to fetch resources.
 */
- (void)fetchFloorplanWithId:(NSString*)floorplanId
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
        if ([weakSelf.delegate respondsToSelector:@selector(location:withFloorPlan:)]) {
            [weakSelf.delegate  location:weakSelf withFloorPlan:floorplan];
            
        }
        
       
        
        
        //weakSelf.floorPlan = floorplan;
    }];
}
#pragma mark supporting methods
/**
 *  Error Log in console
 *
 *  @param state
 */
-(void)setCriticalLog:(NSString *)state{
    //NSLog(@"%@",state);
}

/**
 *  Flag is service running
 *
 *  @return YES/NO
 */
-(BOOL)isServiceActive{
    return !serviceStoped;
}
-(void)setFloorPlan:(NSString *)floorPlan orLocation:(CLLocation *)newLocation{
    BOOL isServiceResume=[self isServiceActive];
    [self.manager stopUpdatingLocation];
    if (floorPlan!=nil) {
        IALocation *location = [IALocation locationWithFloorPlanId:floorPlan];
        self.manager.location = location;
    }
    if (newLocation!=nil) {
        IALocation *location = [IALocation locationWithCLLocation:newLocation];
        self.manager.location = location;
    }
    if (isServiceResume) {
        [self.manager startUpdatingLocation];
    }
    

}
@end
