package com.btrack.modules.measurements.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record BodyMeasurementRequest(
        @NotNull LocalDate date,
        BigDecimal weightKg,
        BigDecimal bodyFatPct,
        BigDecimal waistCm,
        BigDecimal chestCm,
        BigDecimal leftArmCm,
        BigDecimal rightArmCm,
        BigDecimal leftThighCm,
        BigDecimal rightThighCm,
        BigDecimal shouldersCm,
        BigDecimal hipsCm,
        BigDecimal neckCm,
        String notes
) {}
