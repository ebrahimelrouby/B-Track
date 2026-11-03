package com.btrack.modules.user.dto;

public record AdminUserStatsResponse(
        long totalUsers,
        long onlineNow,
        long newToday,
        long newThisWeek
) {}
