package com.btrack.modules.exercise.dto;

import com.btrack.modules.exercise.entity.Exercise;

import java.util.UUID;

public record ExerciseResponse(
        UUID id,
        String name,
        String muscleGroup,
        String equipment,
        String difficulty,
        String instructions,
        String tips,
        String imageUrl,
        String gifUrl,
        boolean isCustom
) {
    public static ExerciseResponse from(Exercise e) {
        return new ExerciseResponse(
                e.getId(),
                e.getName(),
                e.getMuscleGroup() != null ? e.getMuscleGroup().name() : null,
                e.getEquipment() != null ? e.getEquipment().name() : null,
                e.getDifficulty() != null ? e.getDifficulty().name() : null,
                e.getInstructions(),
                e.getTips(),
                e.getImageUrl(),
                e.getGifUrl(),
                e.isCustom()
        );
    }
}
