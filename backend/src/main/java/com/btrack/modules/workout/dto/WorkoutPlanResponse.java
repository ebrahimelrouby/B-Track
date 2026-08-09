package com.btrack.modules.workout.dto;

import com.btrack.modules.workout.entity.WorkoutPlan;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkoutPlanResponse(
        UUID id,
        String name,
        String description,
        List<WorkoutDayResponse> days,
        Instant createdAt
) {
    public static WorkoutPlanResponse from(WorkoutPlan plan) {
        return new WorkoutPlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getDescription(),
                plan.getDays().stream().map(WorkoutDayResponse::from).toList(),
                plan.getCreatedAt()
        );
    }
}
