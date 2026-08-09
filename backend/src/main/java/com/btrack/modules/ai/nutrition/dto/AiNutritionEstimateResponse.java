package com.btrack.modules.ai.nutrition.dto;

import com.btrack.modules.ai.nutrition.entity.AiNutritionEstimate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AiNutritionEstimateResponse(
        UUID id,
        String inputType,
        String inputText,
        String foodName,
        BigDecimal estimatedCalories,
        BigDecimal estimatedProteinG,
        BigDecimal estimatedCarbsG,
        BigDecimal estimatedFatG,
        BigDecimal estimatedFiberG,
        BigDecimal estimatedSugarG,
        BigDecimal estimatedSodiumMg,
        BigDecimal estimatedServingG,
        BigDecimal confirmedCalories,
        BigDecimal confirmedProteinG,
        BigDecimal confirmedCarbsG,
        BigDecimal confirmedFatG,
        BigDecimal confirmedServingG,
        BigDecimal confidenceScore,
        List<String> assumptions,
        String status,
        String mealType,
        LocalDate loggedDate,
        String createdAt
) {
    public static AiNutritionEstimateResponse from(AiNutritionEstimate e) {
        return new AiNutritionEstimateResponse(
                e.getId(),
                e.getInputType().name(),
                e.getInputText(),
                e.getFoodName(),
                e.getEstimatedCalories(),
                e.getEstimatedProteinG(),
                e.getEstimatedCarbsG(),
                e.getEstimatedFatG(),
                e.getEstimatedFiberG(),
                e.getEstimatedSugarG(),
                e.getEstimatedSodiumMg(),
                e.getEstimatedServingG(),
                e.getConfirmedCalories(),
                e.getConfirmedProteinG(),
                e.getConfirmedCarbsG(),
                e.getConfirmedFatG(),
                e.getConfirmedServingG(),
                e.getConfidenceScore(),
                e.getAssumptions(),
                e.getStatus().name(),
                e.getMealType(),
                e.getLoggedDate(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
