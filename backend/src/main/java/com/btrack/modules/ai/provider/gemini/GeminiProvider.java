package com.btrack.modules.ai.provider.gemini;

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
public class GeminiProvider implements AiProvider {

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
        return "gemini";
    }

    @Override
    public AiNutritionResult estimateNutritionFromText(String description) {
        long start = System.currentTimeMillis();
        Map<String, Object> body = buildRequest(NUTRITION_SYSTEM_PROMPT, List.of(Map.of("text", description)));
        String raw = callGemini(model, body);
        long elapsed = System.currentTimeMillis() - start;
        return parseNutritionResult(raw, elapsed);
    }

    @Override
    public AiNutritionResult estimateNutritionFromPhoto(byte[] imageData, String mimeType) {
        long start = System.currentTimeMillis();
        String base64 = Base64.getEncoder().encodeToString(imageData);
        List<Map<String, Object>> parts = List.of(
                Map.of("text", "Analyze this food photo and estimate the nutritional content."),
                Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64))
        );
        Map<String, Object> body = buildRequest(NUTRITION_SYSTEM_PROMPT, parts);
        String raw = callGemini(visionModel, body);
        long elapsed = System.currentTimeMillis() - start;
        return parseNutritionResult(raw, elapsed);
    }

    @Override
    public AiBodyFatResult estimateBodyFat(List<byte[]> photos, BodyMeasurements measurements) {
        long start = System.currentTimeMillis();
        String measurementsText = buildMeasurementsText(measurements);
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text",
                "Estimate body fat percentage from these photos. User measurements: " + measurementsText));
        for (byte[] photo : photos) {
            String base64 = Base64.getEncoder().encodeToString(photo);
            parts.add(Map.of("inline_data", Map.of("mime_type", "image/jpeg", "data", base64)));
        }

        Map<String, Object> body = buildRequest(BODY_FAT_SYSTEM_PROMPT, parts);
        String raw = callGemini(visionModel, body);
        long elapsed = System.currentTimeMillis() - start;
        return parseBodyFatResult(raw, elapsed);
    }

    private Map<String, Object> buildRequest(String systemPrompt, List<Map<String, Object>> userParts) {
        return Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("role", "user", "parts", userParts)),
                "generationConfig", Map.of(
                        "temperature", temperature,
                        "maxOutputTokens", maxTokens,
                        "responseMimeType", "application/json"
                )
        );
    }

    private String callGemini(String mdl, Map<String, Object> body) {
        try {
            return restClient.post()
                    .uri("/models/{model}:generateContent", mdl)
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            throw new BTrackException("AI provider temporarily unavailable. Please try again.",
                    HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.AI_PROVIDER_ERROR);
        }
    }

    /** Gemini returns no candidates (or a SAFETY/RECITATION finish) instead of an HTTP error when content is blocked. */
    private String extractContent(JsonNode root) {
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            String blockReason = root.path("promptFeedback").path("blockReason").asText("");
            log.warn("Gemini returned no candidates. blockReason={}", blockReason);
            throw new BTrackException("The photo could not be analyzed. Please try a different photo.",
                    HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.AI_PROVIDER_ERROR);
        }
        JsonNode first = candidates.get(0);
        String finishReason = first.path("finishReason").asText("");
        if ("SAFETY".equals(finishReason) || "RECITATION".equals(finishReason)) {
            throw new BTrackException("The photo could not be analyzed. Please try a different photo.",
                    HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.AI_PROVIDER_ERROR);
        }
        return first.path("content").path("parts").get(0).path("text").asText();
    }

    private AiNutritionResult parseNutritionResult(String apiResponse, long responseTimeMs) {
        try {
            JsonNode root = objectMapper.readTree(apiResponse);
            int tokens = root.path("usageMetadata").path("totalTokenCount").asInt(0);
            String content = extractContent(root);
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
        } catch (BTrackException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Gemini nutrition response", e);
            throw new BTrackException("Failed to parse AI response. Please try again.",
                    HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.AI_PROVIDER_ERROR);
        }
    }

    private AiBodyFatResult parseBodyFatResult(String apiResponse, long responseTimeMs) {
        try {
            JsonNode root = objectMapper.readTree(apiResponse);
            int tokens = root.path("usageMetadata").path("totalTokenCount").asInt(0);
            String content = extractContent(root);
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
        } catch (BTrackException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Gemini body fat response", e);
            throw new BTrackException("Failed to parse AI response. Please try again.",
                    HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.AI_PROVIDER_ERROR);
        }
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
