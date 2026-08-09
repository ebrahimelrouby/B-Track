package com.btrack.modules.workout.dto;

import com.btrack.modules.exercise.dto.ExerciseResponse;
import com.btrack.modules.workout.entity.WorkoutDayExercise;

import java.math.BigDecimal;
import java.util.UUID;

public record WorkoutDayExerciseResponse(
        UUID id,
        ExerciseResponse exercise,
        int sortOrder,
        Integer targetSets,
        Integer targetRepsMin,
        Integer targetRepsMax,
        BigDecimal targetWeightKg,
        Integer restSeconds,
        String notes
) {
    public static WorkoutDayExerciseResponse from(WorkoutDayExercise wde) {
        return new WorkoutDayExerciseResponse(
                wde.getId(),
                ExerciseResponse.from(wde.getExercise()),
                wde.getSortOrder(),
                wde.getTargetSets(),
                wde.getTargetRepsMin(),
                wde.getTargetRepsMax(),
                wde.getTargetWeightKg(),
                wde.getRestSeconds(),
                wde.getNotes()
        );
    }
}
