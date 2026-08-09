package com.btrack.modules.exercise.service;

import com.btrack.modules.exercise.entity.Exercise;
import org.springframework.stereotype.Service;

@Service
public class ExerciseQualityService {

    // Score weights (total = 100)
    private static final int SCORE_NAME          = 5;
    private static final int SCORE_SLUG          = 5;
    private static final int SCORE_DESCRIPTION   = 10;
    private static final int SCORE_INSTRUCTIONS  = 15;
    private static final int SCORE_TIPS          = 10;
    private static final int SCORE_COMMON_MISTAKES = 10;
    private static final int SCORE_CATEGORY      = 5;
    private static final int SCORE_MOVEMENT      = 5;
    private static final int SCORE_MECHANIC      = 5;
    private static final int SCORE_FORCE_TYPE    = 5;
    private static final int SCORE_SECONDARY_MUSCLES = 5;
    private static final int SCORE_IMAGE         = 5;
    private static final int SCORE_GIF           = 5;
    private static final int SCORE_TAGS          = 5;
    private static final int SCORE_LICENSE       = 5;

    public int calculate(Exercise e) {
        int score = 0;

        if (hasContent(e.getName()))              score += SCORE_NAME;
        if (hasContent(e.getSlug()))              score += SCORE_SLUG;
        if (hasContent(e.getDescription()))       score += SCORE_DESCRIPTION;
        if (hasContent(e.getInstructions()))      score += SCORE_INSTRUCTIONS;
        if (hasContent(e.getTips()))              score += SCORE_TIPS;
        if (hasContent(e.getCommonMistakes()))    score += SCORE_COMMON_MISTAKES;
        if (hasContent(e.getCategory()))          score += SCORE_CATEGORY;
        if (hasContent(e.getMovementPattern()))   score += SCORE_MOVEMENT;
        if (hasContent(e.getMechanic()))          score += SCORE_MECHANIC;
        if (hasContent(e.getForceType()))         score += SCORE_FORCE_TYPE;
        if (e.getSecondaryMuscles() != null && !e.getSecondaryMuscles().isEmpty()) score += SCORE_SECONDARY_MUSCLES;
        if (hasContent(e.getImageUrl()))          score += SCORE_IMAGE;
        if (hasContent(e.getGifUrl()))            score += SCORE_GIF;
        if (e.getTags() != null && !e.getTags().isEmpty())  score += SCORE_TAGS;
        if (hasContent(e.getLicenseType()) && !"unknown".equals(e.getLicenseType())) score += SCORE_LICENSE;

        return Math.min(score, 100);
    }

    private boolean hasContent(String value) {
        return value != null && !value.isBlank();
    }
}
