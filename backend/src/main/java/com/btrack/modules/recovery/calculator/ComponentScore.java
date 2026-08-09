package com.btrack.modules.recovery.calculator;

import java.util.List;

public record ComponentScore(
        int score,
        String status,
        String explanation,
        double confidence,
        List<String> missingData
) {
    public static ComponentScore unknown(String reason) {
        return new ComponentScore(65, "UNKNOWN", reason, 0.30, List.of(reason));
    }

    public static String statusForScore(int score) {
        if (score >= 85) return "EXCELLENT";
        if (score >= 70) return "GOOD";
        if (score >= 55) return "FAIR";
        return "POOR";
    }
}
