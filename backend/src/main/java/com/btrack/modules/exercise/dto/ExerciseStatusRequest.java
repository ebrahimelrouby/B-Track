package com.btrack.modules.exercise.dto;

import jakarta.validation.constraints.NotBlank;

public record ExerciseStatusRequest(
        @NotBlank String status,
        String reason
) {}
