//
//  IAWayfinding.m
//
//  Created by Toni on 27/11/2017.
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>
#import "IAWayfinding.h"
#import <IndoorAtlasWayfinding/wayfinding.h>

/**
 * IAWayfinding wrapper for iOS
 */
@implementation IAWayfinding

/**
 * Initialize the graph with the given graph JSON
 */
- (void)initWithGraph:(CDVInvokedUrlCommand *)command
{
    NSString *graphJson = [command argumentAtIndex:0];
    
    if (self.wayfinderInstances == nil) {
        self.wayfinderInstances = [[NSMutableArray alloc] init];
    }
    
    int wayfinderId = [self.wayfinderInstances count];

    @try {
        Wayfinding *wf = [[Wayfinding alloc] initWithGraph:graphJson];
        [self.wayfinderInstances addObject:wf];
    } @catch(NSException *exception) {
        NSLog(@"graph: %@", exception.reason);
        [self sendErrorCommand:command withMessage:@"Error: graph"];
    }

    CDVPluginResult *pluginResult;
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:1];
    [result setObject: [NSNumber numberWithInteger:wayfinderId] forKey:@"wayfinderId"];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId: command.callbackId];
    
}

/**
 * Compute route for the given values;
 * 1) Set location of the wayfinder instance
 * 2) Set destination of the wayfinder instance
 * 3) Get route between the given location and destination
 */
- (void)computeRoute:(CDVInvokedUrlCommand *)command
{
    NSString *wayfinderId = [command argumentAtIndex:0];
    NSString *lat0 = [command argumentAtIndex:1];
    NSString *lon0 = [command argumentAtIndex:2];
    NSString *floor0 = [command argumentAtIndex:3];
    NSString *lat1 = [command argumentAtIndex:4];
    NSString *lon1 = [command argumentAtIndex:5];
    NSString *floor1 = [command argumentAtIndex:6];
    
    self.wayfinder = self.wayfinderInstances[[wayfinderId intValue]];
    
    @try {
        [self.wayfinder setLocationWithLatitude:[lat0 doubleValue] Longitude:[lon0 doubleValue] Floor:[floor0 intValue]];
    } @catch(NSException *exception) {
        NSLog(@"loc: %@", exception.reason);
        [self sendErrorCommand:command withMessage:@"Error: loc"];
    }
    
    @try {
        [self.wayfinder setDestinationWithLatitude:[lat1 doubleValue] Longitude:[lon1 doubleValue] Floor:[floor1 intValue]];
    } @catch(NSException *exception) {
        NSLog(@"dest: %@", exception.reason);
        [self sendErrorCommand:command withMessage:@"Error: dest"];
    }
    
    CDVPluginResult *pluginResult;
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:1];
    NSArray<RoutingLeg *> *route = [NSArray array];
    
    @try {
        route = [self.wayfinder getRoute];
    } @catch(NSException *exception) {
        NSLog(@"route: %@", exception.reason);
    }
    
    NSMutableArray<NSMutableDictionary *>* routingLegs = [[NSMutableArray alloc] init];
    for (int i=0; i < [route count]; i++) {
        [routingLegs addObject:[self dictionaryFromRoutingLeg:route[i]]];
    }
    
    [result setObject:routingLegs forKey:@"route"];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId: command.callbackId];
}

/**
 * Create NSMutableDictionary from the RoutingLeg object
 */
- (NSMutableDictionary *)dictionaryFromRoutingLeg:(RoutingLeg *)routingLeg {
    return [NSMutableDictionary dictionaryWithObjectsAndKeys: [self dictionaryFromRoutingPoint:routingLeg.begin], @"begin", [self dictionaryFromRoutingPoint:routingLeg.end], @"end", [NSNumber numberWithDouble:routingLeg.length], @"length", [NSNumber numberWithDouble:routingLeg.direction], @"direction", routingLeg.edgeIndexInOriginalGraph, @"edgeIndex", nil];
}

/**
 * Create NSMutableDictionary from the RoutingPoint object
 */
- (NSMutableDictionary *)dictionaryFromRoutingPoint:(RoutingPoint *)routingPoint {
    return [NSMutableDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithDouble:routingPoint.latitude], @"latitude", [NSNumber numberWithDouble:routingPoint.longitude], @"longitude", [NSNumber numberWithInt:routingPoint.floor], @"floor", nil];
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
@end

