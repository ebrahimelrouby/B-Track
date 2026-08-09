package com.btrack.modules.nutrition.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FoodItemResponse(
        UUID id,
        String name,
        String brand,
        BigDecimal calories,
        BigDecimal proteinG,
        BigDecimal carbsG,
        BigDecimal fatG,
        BigDecimal servingSizeG,
        String servingUnit,
        String servingLabel,
        String category
) {}
