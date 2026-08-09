#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WatchBridge, RCTEventEmitter)

RCT_EXTERN_METHOD(updateWorkoutState:(NSDictionary *)state)

@end
