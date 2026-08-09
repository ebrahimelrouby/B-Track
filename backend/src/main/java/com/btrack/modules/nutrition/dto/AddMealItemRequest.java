package com.btrack.modules.nutrition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.UUID;

public record AddMealItemRequest(
        @NotNull UUID foodId,
        @NotNull @Positive double servings,
        @NotBlank String meal,    // breakfast | lunch | dinner | snack
        @NotNull LocalDate date
) {}
