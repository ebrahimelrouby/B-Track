package com.btrack.modules.session.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SyncSessionRequest(
        String localSessionId,
        UUID planId,
        UUID dayId,
        String name,
        Instant startedAt,
        Instant completedAt,
        Integer durationSeconds,
        String notes,
        Integer avgHeartRate,
        Integer maxHeartRate,
        BigDecimal activeCalories,
        List<SyncExercise> exercises
) {
    public record SyncExercise(
            UUID exerciseId,
            int sortOrder,
            String notes,
            List<SyncSet> sets
    ) {}

    public record SyncSet(
            int setNumber,
            String setType,
            BigDecimal weightKg,
            Integer reps,
            BigDecimal rpe,
            Integer restSeconds,
            String notes,
            boolean completed,
            Instant completedAt
    ) {}
}
