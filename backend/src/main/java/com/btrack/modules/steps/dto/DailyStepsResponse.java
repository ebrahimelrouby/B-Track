package com.btrack.modules.steps.dto;

import java.time.LocalDate;

public record DailyStepsResponse(
        LocalDate date,
        int steps,
        int targetSteps,
        double distanceKm,
        int caloriesBurned,
        int activeMinutes
) {}
