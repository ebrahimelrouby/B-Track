package com.btrack.modules.nutrition.dto;

import java.time.LocalDate;

public record DailyCalorieResponse(
        LocalDate date,
        int calories,
        double proteinG,
        double carbsG,
        double fatG
) {}
