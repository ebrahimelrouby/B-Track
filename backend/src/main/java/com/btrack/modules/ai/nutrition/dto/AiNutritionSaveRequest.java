package com.btrack.modules.ai.nutrition.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AiNutritionSaveRequest(
        @NotNull String foodName,
        @NotNull @DecimalMin("0") BigDecimal calories,
        @NotNull @DecimalMin("0") BigDecimal proteinG,
        @NotNull @DecimalMin("0") BigDecimal carbsG,
        @NotNull @DecimalMin("0") BigDecimal fatG,
        BigDecimal fiberG,
        BigDecimal sugarG,
        BigDecimal sodiumMg,
        BigDecimal servingG,
        String mealType,
        String loggedDate
) {}
