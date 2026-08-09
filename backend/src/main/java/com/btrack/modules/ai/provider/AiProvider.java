package com.btrack.modules.ai.provider;

import java.util.List;

public interface AiProvider {

    String providerName();

    AiNutritionResult estimateNutritionFromText(String description);

    AiNutritionResult estimateNutritionFromPhoto(byte[] imageData, String mimeType);

    AiBodyFatResult estimateBodyFat(List<byte[]> photos, BodyMeasurements measurements);

    record BodyMeasurements(
            Double heightCm,
            Double weightKg,
            Integer age,
            String gender,
            String trainingExperience,
            String goal
    ) {}
}
