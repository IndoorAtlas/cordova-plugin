//
//  IAWayfinding.h
//
//  Created by Toni on 27/11/2017.
//

#ifndef IAWayfinding_h
#define IAWayfinding_h

#import <UIKit/UIKit.h>
#import <Cordova/CDVPlugin.h>
#import <IndoorAtlasWayfinding/wayfinding.h>

@interface IAWayfinding : CDVPlugin {
}

@property (nonatomic, strong) Wayfinding *wayfinder;
@property (nonatomic, strong) NSMutableArray *wayfinderInstances;

- (void)initWithGraph:(CDVInvokedUrlCommand *)command;
- (void)computeRoute:(CDVInvokedUrlCommand *)command;

@end

#endif /* IAWayfinding_h */

