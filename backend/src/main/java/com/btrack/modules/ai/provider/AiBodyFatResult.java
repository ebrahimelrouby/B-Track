package com.btrack.modules.ai.provider;

import java.math.BigDecimal;
import java.util.List;

public record AiBodyFatResult(
        BigDecimal minBodyFatPct,
        BigDecimal maxBodyFatPct,
        BigDecimal confidenceScore,
        List<String> visualObservations,
        List<String> recommendations,
        String rawResponse,
        int tokensUsed,
        long responseTimeMs
) {}
