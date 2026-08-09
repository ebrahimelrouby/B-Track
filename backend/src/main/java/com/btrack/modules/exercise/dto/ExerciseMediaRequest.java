package com.btrack.modules.exercise.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExerciseMediaRequest(
        @NotNull String mediaType,    // IMAGE | GIF | VIDEO | THUMBNAIL | SVG_OVERLAY | LOTTIE
        @NotBlank String url,
        String provider,
        String licenseType,
        String author,
        String sourceUrl,
        String attribution,
        boolean commercialUse,
        int displayOrder
) {}
