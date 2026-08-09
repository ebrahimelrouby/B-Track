package com.btrack.modules.subscription.dto;

import java.time.Instant;
import java.util.Set;

public record EntitlementResponse(
        String plan,
        String status,
        boolean isPremium,
        Set<String> features,
        Instant expiresAt,
        int maxWorkoutPlans,       // -1 = unlimited
        int maxCustomExercises,    // -1 = unlimited
        int maxProgressPhotos,     // -1 = unlimited
        int workoutHistoryDays     // -1 = unlimited
) {}
