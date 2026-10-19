import SwiftUI
import HealthKit

/// The system launches the watch app through this delegate when the phone
/// calls `HKHealthStore.startWatchApp(with:)` — that's what starts a real
/// HealthKit workout session on the watch automatically, in step with the
/// phone starting a workout, instead of requiring the user to manually open
/// the watch app first.
class ExtensionDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        HealthKitWorkoutManager.shared.requestAuthorization()
    }

    func handle(_ workoutConfiguration: HKWorkoutConfiguration) async {
        HealthKitWorkoutManager.shared.startSession(configuration: workoutConfiguration)
    }
}

@main
struct BTrackWatchApp: App {
    @WKApplicationDelegateAdaptor(ExtensionDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
