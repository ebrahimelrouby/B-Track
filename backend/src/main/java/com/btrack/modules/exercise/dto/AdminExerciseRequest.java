package com.btrack.modules.exercise.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AdminExerciseRequest(
        @NotBlank String name,
        String slug,
        @NotNull String muscleGroup,
        List<String> secondaryMuscles,
        @NotNull String equipment,
        @NotNull String difficulty,
        String description,
        String instructions,
        String tips,
        String commonMistakes,
        String imageUrl,
        String gifUrl,
        String category,
        String movementPattern,
        String mechanic,
        String forceType,
        List<String> tags,
        String licenseType,
        String attribution,
        String sourceProvider,
        String externalId
) {}
