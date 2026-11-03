import Foundation
import WatchConnectivity

// Manages the connection to the iPhone app. The phone is the source of truth —
// state always flows phone -> watch via updateApplicationContext (delivered
// even if the watch app isn't foregrounded), and actions flow watch -> phone
// via sendMessage (needs both apps active, which matches "mid-workout" usage).
class WorkoutSessionManager: NSObject, ObservableObject {

    static let shared = WorkoutSessionManager()

    @Published var state = WorkoutState()

    private var session: WCSession?

    override init() {
        super.init()
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }

    func sendAction(_ action: String, extra: [String: Any] = [:]) {
        guard session?.isReachable == true else { return }
        var message = extra
        message["action"] = action
        session?.sendMessage(message, replyHandler: nil, errorHandler: nil)
    }
}

extension WorkoutSessionManager: WCSessionDelegate {

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { [weak self] in
            self?.apply(WorkoutState.from(session.receivedApplicationContext))
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async { [weak self] in
            self?.apply(WorkoutState.from(applicationContext))
        }
    }

    // The phone is the source of truth for when a workout stops (Finish or
    // Discard both end up here), regardless of which side ended it — so the
    // real HealthKit session must be closed here too, not just when the
    // watch's own Finish button is tapped.
    private func apply(_ newState: WorkoutState) {
        let wasActive = state.isActive
        state = newState
        if wasActive && !newState.isActive {
            Task { @MainActor in HealthKitWorkoutManager.shared.endSession() }
        }
    }
}
