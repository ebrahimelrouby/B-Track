package com.btrack.modules.recovery.dto;

import com.btrack.modules.recovery.entity.RecoveryScore;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecoveryScoreResponse(
        UUID id,
        LocalDate date,
        int recoveryScore,
        String recoveryLevel,
        double confidence,
        ComponentBreakdown components,
        List<RecoveryRecommendationDto> recommendations,
        List<String> missingData,
        String disclaimer
) {
    public static final String DISCLAIMER =
            "This recovery score is an estimate for fitness tracking only and is not medical advice.";

    public record ComponentBreakdown(
            RecoveryScoreComponentDto sleep,
            RecoveryScoreComponentDto trainingLoad,
            RecoveryScoreComponentDto heartRecovery,
            RecoveryScoreComponentDto hydration,
            RecoveryScoreComponentDto subjectiveWellness
    ) {}

    public static RecoveryScoreResponse from(RecoveryScore rs) {
        Map<String, Object> c = rs.getComponents() != null ? rs.getComponents() : Map.of();

        ComponentBreakdown breakdown = new ComponentBreakdown(
                RecoveryScoreComponentDto.fromMap(c.get("sleep")),
                RecoveryScoreComponentDto.fromMap(c.get("trainingLoad")),
                RecoveryScoreComponentDto.fromMap(c.get("heartRecovery")),
                RecoveryScoreComponentDto.fromMap(c.get("hydration")),
                RecoveryScoreComponentDto.fromMap(c.get("subjectiveWellness"))
        );

        List<RecoveryRecommendationDto> recs = rs.getRecommendations().stream()
                .map(RecoveryRecommendationDto::from)
                .toList();

        return new RecoveryScoreResponse(
                rs.getId(),
                rs.getScoreDate(),
                rs.getFinalScore(),
                rs.getRecoveryLevel().name(),
                rs.getConfidence().doubleValue(),
                breakdown,
                recs,
                rs.getMissingData(),
                DISCLAIMER
        );
    }
}
