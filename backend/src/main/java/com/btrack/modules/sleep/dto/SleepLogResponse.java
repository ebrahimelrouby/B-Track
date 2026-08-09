package com.btrack.modules.sleep.dto;

import java.time.LocalDate;
import java.util.UUID;

public record SleepLogResponse(
        UUID id,
        LocalDate date,
        String bedtime,
        String wakeTime,
        int durationMinutes,
        String quality,
        String notes,
        String createdAt
) {}
