package com.btrack.modules.user.dto;

import com.btrack.modules.user.entity.UserProfile;

import java.time.LocalDate;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String gender,
        LocalDate dateOfBirth,
        Double heightCm,
        Double weightKg,
        Double targetWeightKg,
        String fitnessGoal,
        String activityLevel,
        String trainingExperience,
        String dietaryPreference,
        Integer targetCalories,
        Integer targetProteinG,
        Integer targetCarbsG,
        Integer targetFatsG,
        Integer targetWaterMl,
        Integer targetSteps,
        Double targetSleepHours,
        Integer targetActiveCalories,
        String avatarUrl
) {
    public static UserProfileResponse from(UserProfile p) {
        if (p == null) return null;
        return new UserProfileResponse(
                p.getId(),
                p.getGender() != null ? p.getGender().name() : null,
                p.getDateOfBirth(),
                p.getHeightCm(),
                p.getWeightKg(),
                p.getTargetWeightKg(),
                p.getFitnessGoal() != null ? p.getFitnessGoal().name() : null,
                p.getActivityLevel() != null ? p.getActivityLevel().name() : null,
                p.getTrainingExperience() != null ? p.getTrainingExperience().name() : null,
                p.getDietaryPreference() != null ? p.getDietaryPreference().name() : null,
                p.getTargetCalories(),
                p.getTargetProteinG(),
                p.getTargetCarbsG(),
                p.getTargetFatsG(),
                p.getTargetWaterMl(),
                p.getTargetSteps(),
                p.getTargetSleepHours(),
                p.getTargetActiveCalories(),
                p.getAvatarUrl()
        );
    }
}
