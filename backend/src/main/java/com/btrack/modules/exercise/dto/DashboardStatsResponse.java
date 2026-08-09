package com.btrack.modules.exercise.dto;

import java.util.List;
import java.util.Map;

public record DashboardStatsResponse(
        long totalExercises,
        long publishedExercises,
        long draftExercises,
        long reviewedExercises,
        long archivedExercises,
        long rejectedExercises,
        long customExercises,
        long totalImports,
        double averageQualityScore,
        Map<String, Long> byMuscleGroup,
        Map<String, Long> byEquipment,
        Map<String, Long> byDifficulty,
        Map<String, Long> qualityScoreBuckets,
        List<ActivityPoint> activityTrend
) {
    public record ActivityPoint(String date, long count) {}
}
