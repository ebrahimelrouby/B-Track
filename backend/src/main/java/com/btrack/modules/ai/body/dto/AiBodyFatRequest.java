package com.btrack.modules.ai.body.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record AiBodyFatRequest(
        @AssertTrue(message = "You must provide consent before body analysis")
        boolean consentGiven,
        BigDecimal heightCm,
        BigDecimal weightKg,
        @Min(13) @Max(120) Integer age,
        String gender,
        String trainingExperience,
        String goal
) {}
