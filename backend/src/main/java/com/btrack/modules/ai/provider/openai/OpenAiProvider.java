package com.btrack.modules.ai.provider.openai;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.ai.provider.AiBodyFatResult;
import com.btrack.modules.ai.provider.AiNutritionResult;
import com.btrack.modules.ai.provider.AiProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class OpenAiProvider implements AiProvider {

    private static final String NUTRITION_SYSTEM_PROMPT = """
            You are a professional nutritionist AI. Analyze the food and estimate macros.
            Return ONLY valid JSON with exactly these fields:
            {
              "foodName": "string",
              "calories": number,
              "proteinG": number,
              "carbsG": number,
              "fatG": number,
              "fiberG": number,
              "sugarG": number,
              "sodiumMg": number,
              "servingG": number,
              "confidenceScore": number between 0 and 1,
              "assumptions": ["string", ...]
            }
            Use 0 for unknown values. Be honest about uncertainty in assumptions.
            """;

    private static final String BODY_FAT_SYSTEM_PROMPT = """
            You are a certified fitness assessment AI. Analyze body composition from photos.
            IMPORTANT: Always return a RANGE, never a single value.
            Return ONLY valid JSON with exactly these fields:
            {
              "minBodyFatPct": number,
              "maxBodyFatPct": number,
              "confidenceScore": number between 0 and 1,
              "visualObservations": ["string", ...],
              "recommendations": ["string", ...]
            }
            Be conservative and honest. Include a disclaimer in observations that this is an estimate.
            Never analyze inappropriate content — return an error message if the photo is not suitable.
            """;

    private final RestClient restClient;
    private final String model;
    private final String visionModel;
    private final int maxTokens;
    private final double temperature;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String providerName() {
        return "openai";
    }

    @Override
    public AiNutritionResult estimateNutritionFromText(String description) {
        long start = System.currentTimeMillis();
        Map<String, Object> body = buildTextRequest(model, NUTRITION_SYSTEM_PROMPT, description);
        String raw = callOpenAi(body);
        long elapsed = System.currentTimeMillis() - start;
        return parseNutritionResult(raw, elapsed);
    }

    @Override
    public AiNutritionResult estimateNutritionFromPhoto(byte[] imageData, String mimeType) {
        long start = System.currentTimeMillis();
        String base64 = Base64.getEncoder().encodeToString(imageData);
        String dataUrl = "data:" + mimeType + ";base64," + base64;

        Map<String, Object> body = buildVisionRequest(visionModel, NUTRITION_SYSTEM_PROMPT,
                "Analyze this food photo and estimate the nutritional content.", dataUrl);
        String raw = callOpenAi(body);
        long elapsed = System.currentTimeMillis() - start;
        return parseNutritionResult(raw, elapsed);
    }

    @Override
    public AiBodyFatResult estimateBodyFat(List<byte[]> photos, BodyMeasurements measurements) {
        long start = System.currentTimeMillis();
        String measurementsText = buildMeasurementsText(measurements);
        List<Map<String, Object>> contentParts = new ArrayList<>();
        contentParts.add(Map.of("type", "text", "text",
                "Estimate body fat percentage from these photos. User measurements: " + measurementsText));
        for (byte[] photo : photos) {
            String base64 = Base64.getEncoder().encodeToString(photo);
            contentParts.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", "data:image/jpeg;base64," + base64, "detail", "low")
            ));
        }

        Map<String, Object> body = Map.of(
                "model", visionModel,
                "messages", List.of(
                        Map.of("role", "system", "content", BODY_FAT_SYSTEM_PROMPT),
                        Map.of("role", "user", "content", contentParts)
                ),
                "max_tokens", maxTokens,
                "temperature", temperature
        );

        String raw = callOpenAi(body);
        long elapsed = System.currentTimeMillis() - start;
        return parseBodyFatResult(raw, elapsed);
    }

    private String callOpenAi(Map<String, Object> body) {
        try {
            return restClient.post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            throw new BTrackException("AI provider temporarily unavailable. Please try again.",
                    HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.AI_PROVIDER_ERROR);
        }
    }

    private AiNutritionResult parseNutritionResult(String apiResponse, long responseTimeMs) {
        try {
            JsonNode root = objectMapper.readTree(apiResponse);
            int tokens = root.path("usage").path("total_tokens").asInt(0);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            String jsonContent = extractJson(content);
            JsonNode data = objectMapper.readTree(jsonContent);

            List<String> assumptions = new ArrayList<>();
            data.path("assumptions").forEach(n -> assumptions.add(n.asText()));

            return new AiNutritionResult(
                    data.path("foodName").asText("Unknown food"),
                    bd(data, "calories"),
                    bd(data, "proteinG"),
                    bd(data, "carbsG"),
                    bd(data, "fatG"),
                    bd(data, "fiberG"),
                    bd(data, "sugarG"),
                    bd(data, "sodiumMg"),
                    bd(data, "servingG"),
                    bd(data, "confidenceScore"),
                    assumptions,
                    apiResponse,
                    tokens,
                    responseTimeMs
            );
        } catch (Exception e) {
            log.error("Failed to parse OpenAI nutrition response", e);
            throw new BTrackException("Failed to parse AI response. Please try again.",
                    HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.AI_PROVIDER_ERROR);
        }
    }

    private AiBodyFatResult parseBodyFatResult(String apiResponse, long responseTimeMs) {
        try {
            JsonNode root = objectMapper.readTree(apiResponse);
            int tokens = root.path("usage").path("total_tokens").asInt(0);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            String jsonContent = extractJson(content);
            JsonNode data = objectMapper.readTree(jsonContent);

            List<String> observations = new ArrayList<>();
            data.path("visualObservations").forEach(n -> observations.add(n.asText()));
            List<String> recommendations = new ArrayList<>();
            data.path("recommendations").forEach(n -> recommendations.add(n.asText()));

            return new AiBodyFatResult(
                    bd(data, "minBodyFatPct"),
                    bd(data, "maxBodyFatPct"),
                    bd(data, "confidenceScore"),
                    observations,
                    recommendations,
                    apiResponse,
                    tokens,
                    responseTimeMs
            );
        } catch (Exception e) {
            log.error("Failed to parse OpenAI body fat response", e);
            throw new BTrackException("Failed to parse AI response. Please try again.",
                    HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.AI_PROVIDER_ERROR);
        }
    }

    private Map<String, Object> buildTextRequest(String mdl, String system, String user) {
        return Map.of(
                "model", mdl,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)
                ),
                "max_tokens", maxTokens,
                "temperature", temperature
        );
    }

    private Map<String, Object> buildVisionRequest(String mdl, String system, String prompt, String dataUrl) {
        return Map.of(
                "model", mdl,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", List.of(
                                Map.of("type", "text", "text", prompt),
                                Map.of("type", "image_url", "image_url",
                                        Map.of("url", dataUrl, "detail", "low"))
                        ))
                ),
                "max_tokens", maxTokens,
                "temperature", temperature
        );
    }

    private String buildMeasurementsText(BodyMeasurements m) {
        StringBuilder sb = new StringBuilder();
        if (m.heightCm() != null) sb.append("height=").append(m.heightCm()).append("cm ");
        if (m.weightKg() != null) sb.append("weight=").append(m.weightKg()).append("kg ");
        if (m.age() != null) sb.append("age=").append(m.age()).append(" ");
        if (m.gender() != null) sb.append("gender=").append(m.gender()).append(" ");
        if (m.trainingExperience() != null) sb.append("experience=").append(m.trainingExperience()).append(" ");
        if (m.goal() != null) sb.append("goal=").append(m.goal());
        return sb.toString().trim();
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) return text.substring(start, end + 1);
        return text;
    }

    private BigDecimal bd(JsonNode node, String field) {
        JsonNode val = node.path(field);
        if (val.isMissingNode() || val.isNull()) return BigDecimal.ZERO;
        return new BigDecimal(val.asText("0"));
    }
}
