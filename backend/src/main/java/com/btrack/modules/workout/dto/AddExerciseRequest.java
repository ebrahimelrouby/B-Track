package com.btrack.modules.workout.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddExerciseRequest(
        @NotNull UUID exerciseId,
        Integer targetSets,
        Integer targetRepsMin,
        Integer targetRepsMax,
        Double targetWeightKg,
        Integer restSeconds,
        String notes
) {}
