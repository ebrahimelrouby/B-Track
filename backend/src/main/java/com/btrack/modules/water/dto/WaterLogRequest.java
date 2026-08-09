package com.btrack.modules.water.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record WaterLogRequest(
        @NotNull @Min(1) Integer ml,
        String drinkType,
        String notes
) {}
