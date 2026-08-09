package com.btrack.modules.ai.body.dto;

import com.btrack.modules.ai.body.entity.AiBodyFatEstimate;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AiBodyFatEstimateResponse(
        UUID id,
        BigDecimal minBodyFatPct,
        BigDecimal maxBodyFatPct,
        BigDecimal confidenceScore,
        BigDecimal heightCm,
        BigDecimal weightKg,
        Integer age,
        String gender,
        String trainingExperience,
        List<String> visualObservations,
        List<String> recommendations,
        String status,
        String createdAt
) {
    public static AiBodyFatEstimateResponse from(AiBodyFatEstimate e) {
        return new AiBodyFatEstimateResponse(
                e.getId(),
                e.getMinBodyFatPct(),
                e.getMaxBodyFatPct(),
                e.getConfidenceScore(),
                e.getHeightCm(),
                e.getWeightKg(),
                e.getAge(),
                e.getGender(),
                e.getTrainingExperience(),
                e.getVisualObservations(),
                e.getRecommendations(),
                e.getStatus().name(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
