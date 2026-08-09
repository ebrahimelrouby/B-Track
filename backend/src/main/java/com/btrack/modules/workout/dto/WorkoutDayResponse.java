package com.btrack.modules.workout.dto;

import com.btrack.modules.workout.entity.WorkoutDay;

import java.util.List;
import java.util.UUID;

public record WorkoutDayResponse(
        UUID id,
        UUID planId,
        String name,
        int sortOrder,
        String notes,
        List<WorkoutDayExerciseResponse> exercises
) {
    public static WorkoutDayResponse from(WorkoutDay day) {
        return new WorkoutDayResponse(
                day.getId(),
                day.getPlan().getId(),
                day.getName(),
                day.getSortOrder(),
                day.getNotes(),
                day.getExercises().stream().map(WorkoutDayExerciseResponse::from).toList()
        );
    }
}
