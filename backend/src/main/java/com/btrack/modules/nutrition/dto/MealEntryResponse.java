package com.btrack.modules.nutrition.dto;

import java.time.LocalDate;
import java.util.UUID;

public record MealEntryResponse(
        UUID id,
        UUID foodId,
        FoodItemResponse food,
        double servings,
        String meal,
        LocalDate date
) {}
