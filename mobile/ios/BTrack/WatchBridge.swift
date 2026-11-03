import Foundation
import WatchConnectivity
import React

/// Phone-side bridge to the BTrack Watch companion app, mirroring the shape of
/// the Android WatchBridgeModule so RN code (src/native/watch.ts) is unified
/// across platforms. Pushes workout state via WCSession's application context
/// (delivered even if the watch app isn't foregrounded) and relays
/// watch-triggered actions back to JS as a "WatchAction" event.
@objc(WatchBridge)
class WatchBridge: RCTEventEmitter {

    private var session: WCSession?
    private var hasListeners = false

    override init() {
        super.init()
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }

    @objc override static func requiresMainQueueSetup() -> Bool { false }

    override func supportedEvents() -> [String] { ["WatchAction"] }

    override func startObserving() { hasListeners = true }
    override func stopObserving() { hasListeners = false }

    @objc(updateWorkoutState:)
    func updateWorkoutState(_ state: NSDictionary) {
        guard let session, session.activationState == .activated,
              let dict = state as? [String: Any] else { return }
        try? session.updateApplicationContext(dict)
    }
}

extension WatchBridge: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard hasListeners, message["action"] is String else { return }
        sendEvent(withName: "WatchAction", body: message)
    }
}
