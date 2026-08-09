package com.btrack.modules.recovery.dto;

import com.btrack.modules.recovery.calculator.ComponentScore;

public record RecoveryScoreComponentDto(
        int score,
        String status,
        String explanation,
        double confidence
) {
    public static RecoveryScoreComponentDto from(ComponentScore cs) {
        return new RecoveryScoreComponentDto(cs.score(), cs.status(), cs.explanation(), cs.confidence());
    }

    // Re-hydrate from the JSONB map stored in the DB
    @SuppressWarnings("unchecked")
    public static RecoveryScoreComponentDto fromMap(Object raw) {
        if (raw instanceof java.util.Map<?, ?> rawMap) {
            java.util.Map<String, Object> m = (java.util.Map<String, Object>) rawMap;
            int score = ((Number) m.getOrDefault("score", 65)).intValue();
            String status = (String) m.getOrDefault("status", "UNKNOWN");
            String explanation = (String) m.getOrDefault("explanation", "");
            double confidence = ((Number) m.getOrDefault("confidence", 0.5)).doubleValue();
            return new RecoveryScoreComponentDto(score, status, explanation, confidence);
        }
        return new RecoveryScoreComponentDto(65, "UNKNOWN", "Data unavailable.", 0.3);
    }
}
