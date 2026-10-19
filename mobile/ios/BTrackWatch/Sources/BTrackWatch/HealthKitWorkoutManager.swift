import Foundation
import HealthKit

/// Owns the real HKWorkoutSession/HKLiveWorkoutBuilder on the watch — this is
/// what actually records a workout into Health (heart rate, active energy,
/// duration) and is what makes the system treat this as a genuine watchOS
/// workout, not just a UI mirroring the phone's local state.
///
/// This is launched automatically by the system when the phone calls
/// `HKHealthStore.startWatchApp(with:)` (see `ExtensionDelegate.handle(_:)`
/// in BTrackWatchApp.swift) — it does not depend on WorkoutSessionManager's
/// WatchConnectivity channel, which is only used for the exercise/set/rest
/// data that HealthKit has no concept of.
@MainActor
class HealthKitWorkoutManager: NSObject, ObservableObject {

    static let shared = HealthKitWorkoutManager()

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    @Published var isSessionActive = false
    @Published var heartRate: Double = 0
    @Published var activeCalories: Double = 0

    func requestAuthorization(completion: @escaping (Bool) -> Void = { _ in }) {
        guard HKHealthStore.isHealthDataAvailable() else { completion(false); return }
        let typesToShare: Set = [HKQuantityType.workoutType()]
        let typesToRead: Set = [
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
        ]
        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, _ in
            DispatchQueue.main.async { completion(success) }
        }
    }

    func startSession(configuration: HKWorkoutConfiguration) {
        guard session == nil else { return } // already running — the system can re-deliver the same launch
        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)

            session.delegate = self
            builder.delegate = self

            self.session = session
            self.builder = builder

            let startDate = Date()
            session.startActivity(with: startDate)
            builder.beginCollection(withStart: startDate) { [weak self] success, _ in
                DispatchQueue.main.async { self?.isSessionActive = success }
            }
        } catch {
            print("[HealthKitWorkoutManager] failed to start session: \(error)")
        }
    }

    func endSession() {
        guard let session, let builder else { return }
        session.end()
        builder.endCollection(withEnd: Date()) { [weak self] _, _ in
            builder.finishWorkout { _, _ in
                DispatchQueue.main.async {
                    self?.isSessionActive = false
                    self?.heartRate = 0
                    self?.activeCalories = 0
                    self?.session = nil
                    self?.builder = nil
                }
            }
        }
    }
}

extension HealthKitWorkoutManager: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        Task { @MainActor in
            self.isSessionActive = (toState == .running)
        }
    }

    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        print("[HealthKitWorkoutManager] session failed: \(error)")
    }
}

extension HealthKitWorkoutManager: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }
            let statistics = workoutBuilder.statistics(for: quantityType)
            Task { @MainActor in
                if quantityType == HKQuantityType(.heartRate) {
                    let unit = HKUnit.count().unitDivided(by: .minute())
                    self.heartRate = statistics?.mostRecentQuantity()?.doubleValue(for: unit) ?? 0
                } else if quantityType == HKQuantityType(.activeEnergyBurned) {
                    self.activeCalories = statistics?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                }
            }
        }
    }

    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
