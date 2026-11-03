-- Per-workout-session heart rate and active-calories, captured from the
-- Apple Watch's live HKWorkoutSession when a workout is finished from the
-- watch. Nullable — only populated for watch-finished sessions.
ALTER TABLE workout_sessions
    ADD COLUMN avg_heart_rate INTEGER,
    ADD COLUMN max_heart_rate INTEGER,
    ADD COLUMN active_calories NUMERIC(7, 1);
