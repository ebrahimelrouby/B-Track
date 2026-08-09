package com.btrack.modules.user.dto;

import java.time.LocalDate;
import java.util.List;

public record UpdateProfileRequest(
        String firstName,
        String lastName,
        String gender,
        LocalDate dateOfBirth,
        Double heightCm,
        Double weightKg,
        Double targetWeightKg,
        String fitnessGoal,
        String activityLevel,
        String trainingExperience,
        String dietaryPreference,
        List<String> preferredWorkoutDays,
        Integer targetWaterMl,
        Integer targetSteps,
        Double targetSleepHours
) {}
