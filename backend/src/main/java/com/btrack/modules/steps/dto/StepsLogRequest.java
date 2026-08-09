package com.btrack.modules.steps.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record StepsLogRequest(
        @NotNull LocalDate date,
        @NotNull @Min(0) Integer steps
) {}
