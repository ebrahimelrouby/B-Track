package com.btrack.modules.session.dto;

import com.btrack.modules.session.entity.WorkoutSet;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WorkoutSetResponse(
        UUID id,
        int setNumber,
        String setType,
        BigDecimal weightKg,
        Integer reps,
        BigDecimal rpe,
        Integer restSeconds,
        String notes,
        boolean isCompleted,
        Instant completedAt
) {
    public static WorkoutSetResponse from(WorkoutSet s) {
        return new WorkoutSetResponse(
                s.getId(),
                s.getSetNumber(),
                s.getSetType() != null ? s.getSetType().name() : null,
                s.getWeightKg(),
                s.getReps(),
                s.getRpe(),
                s.getRestSeconds(),
                s.getNotes(),
                s.isCompleted(),
                s.getCompletedAt()
        );
    }
}
