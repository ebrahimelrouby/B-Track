package com.btrack.modules.recovery.dto;

import com.btrack.modules.recovery.entity.RecoveryRecommendation;

import java.util.UUID;

public record RecoveryRecommendationDto(
        UUID id,
        String type,
        String title,
        String description,
        int priority
) {
    public static RecoveryRecommendationDto from(RecoveryRecommendation r) {
        return new RecoveryRecommendationDto(r.getId(), r.getType(), r.getTitle(), r.getDescription(), r.getPriority());
    }
}
