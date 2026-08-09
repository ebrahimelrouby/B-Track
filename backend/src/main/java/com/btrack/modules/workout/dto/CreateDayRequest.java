package com.btrack.modules.workout.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDayRequest(@NotBlank String name, String notes) {}
