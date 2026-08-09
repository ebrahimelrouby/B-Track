package com.btrack.modules.session.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record LogSetRequest(
        @NotNull UUID exerciseId,
        int setNumber,
        String setType,
        BigDecimal weightKg,
        Integer reps,
        BigDecimal rpe,
        Integer restSeconds,
        String notes
) {}
