import Foundation

/// Mirrors the RN-side `WatchWorkoutState` shape (src/native/watch.ts), delivered
/// via `WCSession.updateApplicationContext`. Timestamps are epoch-ms so the watch
/// computes its own live elapsed/rest countdowns instead of needing a per-second
/// stream over Bluetooth.
struct WorkoutState {
    var isActive: Bool = false
    var workoutName: String?
    var startedAtMs: Double?
    var isPaused: Bool = false
    var currentExerciseName: String?
    var lastWeightKg: Double?
    var lastReps: Int?
    var restEndTimeMs: Double?

    static func from(_ dict: [String: Any]) -> WorkoutState {
        WorkoutState(
            isActive: dict["isActive"] as? Bool ?? false,
            workoutName: dict["workoutName"] as? String,
            startedAtMs: dict["startedAtMs"] as? Double,
            isPaused: dict["isPaused"] as? Bool ?? false,
            currentExerciseName: dict["currentExerciseName"] as? String,
            lastWeightKg: dict["lastWeightKg"] as? Double,
            lastReps: dict["lastReps"] as? Int,
            restEndTimeMs: dict["restEndTimeMs"] as? Double
        )
    }
}
