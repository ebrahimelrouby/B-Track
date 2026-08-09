package com.btrack.modules.sleep.dto;

import java.time.LocalDate;
import java.util.List;

public record DailySleepResponse(
        LocalDate date,
        List<SleepLogResponse> logs,
        int totalMinutes,
        int targetMinutes,
        String quality
) {}
