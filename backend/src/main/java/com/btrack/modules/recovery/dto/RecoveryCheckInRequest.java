package com.btrack.modules.recovery.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RecoveryCheckInRequest(
        LocalDate date,

        @NotNull @Min(1) @Max(5)
        Integer energyLevel,

        @NotNull @Min(1) @Max(5)
        Integer sorenessLevel,

        @NotNull @Min(1) @Max(5)
        Integer stressLevel,

        @NotNull @Min(1) @Max(5)
        Integer moodLevel,

        @NotNull @Min(1) @Max(5)
        Integer motivationLevel,

        String notes
) {
    public LocalDate resolvedDate() {
        return date != null ? date : LocalDate.now();
    }
}
