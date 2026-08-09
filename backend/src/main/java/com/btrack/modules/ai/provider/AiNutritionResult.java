package com.btrack.modules.ai.provider;

import java.math.BigDecimal;
import java.util.List;

public record AiNutritionResult(
        String foodName,
        BigDecimal calories,
        BigDecimal proteinG,
        BigDecimal carbsG,
        BigDecimal fatG,
        BigDecimal fiberG,
        BigDecimal sugarG,
        BigDecimal sodiumMg,
        BigDecimal servingG,
        BigDecimal confidenceScore,
        List<String> assumptions,
        String rawResponse,
        int tokensUsed,
        long responseTimeMs
) {}
