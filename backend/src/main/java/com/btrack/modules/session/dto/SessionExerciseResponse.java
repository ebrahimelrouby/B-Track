package com.btrack.modules.session.dto;

import com.btrack.modules.exercise.dto.ExerciseResponse;
import com.btrack.modules.session.entity.SessionExercise;

import java.util.List;
import java.util.UUID;

public record SessionExerciseResponse(
        UUID id,
        ExerciseResponse exercise,
        int sortOrder,
        String notes,
        List<WorkoutSetResponse> sets
) {
    public static SessionExerciseResponse from(SessionExercise se) {
        return new SessionExerciseResponse(
                se.getId(),
                ExerciseResponse.from(se.getExercise()),
                se.getSortOrder(),
                se.getNotes(),
                se.getSets().stream().map(WorkoutSetResponse::from).toList()
        );
    }
}
