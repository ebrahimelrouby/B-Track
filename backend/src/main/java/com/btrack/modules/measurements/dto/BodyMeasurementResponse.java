package com.btrack.modules.measurements.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BodyMeasurementResponse(
        UUID id,
        LocalDate date,
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
        String notes,
        String createdAt
) {}
