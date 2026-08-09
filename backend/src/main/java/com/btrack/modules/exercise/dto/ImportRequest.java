package com.btrack.modules.exercise.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record ImportRequest(
        @NotBlank String provider,       // FREE_EXERCISE_DB | WGER | CSV | JSON
        String datasetVersion,
        boolean dryRun,
        boolean overwriteExisting,
        Map<String, Object> options      // provider-specific options (e.g. file path, filter)
) {}
