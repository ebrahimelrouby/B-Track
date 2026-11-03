package com.btrack.modules.session.dto;

import com.btrack.modules.session.entity.WorkoutSession;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkoutSessionResponse(
        UUID id,
        String name,
        String status,
        Instant startedAt,
        Instant completedAt,
        Integer durationSeconds,
        BigDecimal totalVolumeKg,
        Integer avgHeartRate,
        Integer maxHeartRate,
        BigDecimal activeCalories,
        List<SessionExerciseResponse> exercises,
        String notes
) {
    public static WorkoutSessionResponse from(WorkoutSession session) {
        return new WorkoutSessionResponse(
                session.getId(),
                session.getName(),
                session.getStatus() != null ? session.getStatus().name() : null,
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getDurationSeconds(),
                session.getTotalVolumeKg(),
                session.getAvgHeartRate(),
                session.getMaxHeartRate(),
                session.getActiveCalories(),
                session.getExercises().stream().map(SessionExerciseResponse::from).toList(),
                session.getNotes()
        );
    }
}
