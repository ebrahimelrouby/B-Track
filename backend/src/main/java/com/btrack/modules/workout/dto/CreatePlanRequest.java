package com.btrack.modules.workout.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlanRequest(
        @NotBlank @Size(max = 200) String name,
        String description
) {}
