package com.btrackscaffold.wear

import kotlinx.coroutines.flow.MutableStateFlow
import org.json.JSONObject

/**
 * Mirrors the RN-side `WatchWorkoutState` shape (src/native/watch.ts) sent as
 * a JSON string over the Data Layer MessageClient. Timestamps are epoch-ms so
 * the watch can compute its own live elapsed/rest countdowns without needing
 * a per-second stream over Bluetooth.
 */
data class WorkoutState(
    val isActive: Boolean = false,
    val workoutName: String? = null,
    val startedAtMs: Long? = null,
    val isPaused: Boolean = false,
    val currentExerciseName: String? = null,
    val lastWeightKg: Double? = null,
    val lastReps: Int? = null,
    val restEndTimeMs: Long? = null,
) {
    companion object {
        fun fromJson(json: String): WorkoutState {
            val o = JSONObject(json)
            return WorkoutState(
                isActive = o.optBoolean("isActive", false),
                workoutName = if (o.has("workoutName") && !o.isNull("workoutName")) o.getString("workoutName") else null,
                startedAtMs = if (o.has("startedAtMs") && !o.isNull("startedAtMs")) o.getLong("startedAtMs") else null,
                isPaused = o.optBoolean("isPaused", false),
                currentExerciseName = if (o.has("currentExerciseName") && !o.isNull("currentExerciseName")) o.getString("currentExerciseName") else null,
                lastWeightKg = if (o.has("lastWeightKg") && !o.isNull("lastWeightKg")) o.getDouble("lastWeightKg") else null,
                lastReps = if (o.has("lastReps") && !o.isNull("lastReps")) o.getInt("lastReps") else null,
                restEndTimeMs = if (o.has("restEndTimeMs") && !o.isNull("restEndTimeMs")) o.getLong("restEndTimeMs") else null,
            )
        }
    }
}

/** Process-wide holder — simple StateFlow instead of a DI framework for this small app. */
object WorkoutStateHolder {
    val state = MutableStateFlow(WorkoutState())
}
