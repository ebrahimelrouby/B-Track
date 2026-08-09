package com.btrack.modules.exercise.dto;

public record TranslationRequest(
        String name,
        String description,
        String instructions,
        String tips,
        String commonMistakes
) {}
