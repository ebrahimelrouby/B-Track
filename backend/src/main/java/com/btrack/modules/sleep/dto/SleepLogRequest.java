package com.btrack.modules.sleep.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record SleepLogRequest(
        @NotNull LocalDate date,
        @NotBlank String bedtime,   // ISO-8601 datetime
        @NotBlank String wakeTime,  // ISO-8601 datetime
        String quality,             // EXCELLENT | GOOD | FAIR | POOR
        String notes
) {}
