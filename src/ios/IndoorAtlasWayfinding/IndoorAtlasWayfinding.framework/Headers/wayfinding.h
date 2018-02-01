//
//  wayfinding.h
//  wayfinding
//
//  Created by Juha Ala-Luhtala on 16/11/2017.
//  Copyright © 2017 IndoorAtlas. All rights reserved.
//

#import <Foundation/Foundation.h>

#define IA_WAYFINDING_API __attribute__((visibility("default")))

/**
 * Represents one point in the route
 */
 IA_WAYFINDING_API
@interface IARoutingPoint : NSObject
-(id)initWithLatitude:(double)lat Longitude:(double)lon Floor:(int)floor NodeIndex:(int)index;

/**
 * Latitude of the point in WGS coordinates
 */
@property (readonly) double latitude;

/**
 * Longitude of the point in WGS coordinates
 */
@property (readonly) double longitude;

/**
 * Floor number of the point
 */
@property (readonly) int floor;


/**
 * Index (NSUinteger) of the node point in original graph. The value is null if not set.
 */
@property (readonly) NSNumber *nodeIndexInOriginalGraph;
@end

/**
 * Represents one leg in the route.
 */
 IA_WAYFINDING_API
@interface IARoutingLeg : NSObject
-(id)initWithBegin:(IARoutingPoint*)begin End:(IARoutingPoint*)end Length:(double)length Direction:(double)direction EdgeIndex:(int)index;


/**
 * The beginning point of the route.
 */
@property (readonly) IARoutingPoint *begin;


/**
 * The end point of the route.
 */
@property (readonly) IARoutingPoint *end;


/**
 * Length of the leg in meters.
 */
@property (readonly) double length;


/**
 * Direction of the leg in degrees. North is marked with 0 degrees and direction rotates clockwise i.e. 90 degrees is East, 180 degrees is South and 270 degrees is West.
 */
@property (readonly) double direction;


/**
 * Index (NSUinteger) of the edge in the original graph. The value is null of edge not found from the graph.
 */
@property (readonly) NSNumber *edgeIndexInOriginalGraph;
@end


IA_WAYFINDING_API
/**
 * Interface for doing wayfinding.
 */
@interface IAWayfinding : NSObject

/**
 * Constructor.
 * Sets the wayfinding graph.
 * Throws exception if graph cannot be set.
 *
 * @param graphJson Wayfinding graph in JSON format
 * @return id of the object
 */
-(id)initWithGraph:(NSString*) graphJson;


/**
 * Destructor
 */
-(void)dealloc;

/**
 * Set destination point.
 *
 * @param lat Latitude of the destination in WGS coordinates
 * @param lon Longitude of the destination in WGS coordinates
 * @param floor Floor number of the destination
 */
-(void)setDestinationWithLatitude:(double)lat Longitude:(double)lon Floor:(int)floor;


/**
 * Set current location point.
 *
 * @param lat Latitude of the location in WGS coordinates
 * @param lon Longitude of the location in WGS coordinates
 * @param floor Floor of the location
 */
-(void)setLocationWithLatitude:(double)lat Longitude:(double)lon Floor:(int)floor;


/**
 * Returns the route from location to destination.
 *
 * @return Array of routing legs. Array is empty, if route cannot be computed.
 */
-(NSArray<IARoutingLeg*>*)getRoute;
@end

#undef IA_WAYFINDING_API
