package com.btrack.modules.exercise.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateExerciseRequest(
        @NotBlank String name,
        @NotBlank String muscleGroup,
        @NotBlank String equipment,
        @NotBlank String difficulty,
        String instructions,
        String tips,
        String imageUrl,
        String gifUrl
) {}
