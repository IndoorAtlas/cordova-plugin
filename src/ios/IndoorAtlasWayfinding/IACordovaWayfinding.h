//
//  IACordovaWayfinding.h
//
//  Created by Toni on 27/11/2017.
//

#ifndef IACordovaWayfinding_h
#define IACordovaWayfinding_h

#import <UIKit/UIKit.h>
#import <Cordova/CDVPlugin.h>
#import <IndoorAtlasWayfinding/wayfinding.h>

@interface IACordovaWayfinding : CDVPlugin {
}

@property (nonatomic, strong) IAWayfinding *wayfinder;
@property (nonatomic, strong) NSMutableArray *wayfinderInstances;

- (void)initWithGraph:(CDVInvokedUrlCommand *)command;
- (void)computeRoute:(CDVInvokedUrlCommand *)command;

@end

#endif /* IACordovaWayfinding_h */

