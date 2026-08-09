package com.btrack.modules.ai.nutrition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiNutritionTextRequest(
        @NotBlank(message = "Food description is required")
        @Size(min = 3, max = 500, message = "Description must be 3–500 characters")
        String description
) {}
