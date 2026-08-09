package com.btrack.modules.exercise.dto;

import com.btrack.modules.exercise.entity.Exercise;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminExerciseResponse(
        UUID id,
        String name,
        String slug,
        String muscleGroup,
        List<String> secondaryMuscles,
        String equipment,
        String difficulty,
        String description,
        String instructions,
        String tips,
        String commonMistakes,
        String imageUrl,
        String gifUrl,
        String category,
        String movementPattern,
        String mechanic,
        String forceType,
        List<String> tags,
        String status,
        int qualityScore,
        String licenseType,
        String attribution,
        String sourceProvider,
        String externalId,
        boolean custom,
        Instant publishedAt,
        Instant reviewedAt,
        String reviewedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static AdminExerciseResponse from(Exercise e) {
        return new AdminExerciseResponse(
                e.getId(),
                e.getName(),
                e.getSlug(),
                e.getMuscleGroup() != null ? e.getMuscleGroup().name() : null,
                e.getSecondaryMuscles() != null
                        ? e.getSecondaryMuscles().stream().map(Enum::name).toList()
                        : List.of(),
                e.getEquipment() != null ? e.getEquipment().name() : null,
                e.getDifficulty() != null ? e.getDifficulty().name() : null,
                e.getDescription(),
                e.getInstructions(),
                e.getTips(),
                e.getCommonMistakes(),
                e.getImageUrl(),
                e.getGifUrl(),
                e.getCategory(),
                e.getMovementPattern(),
                e.getMechanic(),
                e.getForceType(),
                e.getTags(),
                e.getStatus() != null ? e.getStatus().name() : null,
                e.getQualityScore(),
                e.getLicenseType(),
                e.getAttribution(),
                e.getSourceProvider(),
                e.getExternalId(),
                e.isCustom(),
                e.getPublishedAt(),
                e.getReviewedAt(),
                e.getReviewedBy() != null ? e.getReviewedBy().getFullName() : null,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
