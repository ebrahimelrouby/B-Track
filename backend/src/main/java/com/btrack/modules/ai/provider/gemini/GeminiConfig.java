package com.btrack.modules.ai.provider.gemini;

import com.btrack.modules.ai.provider.AiProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@ConditionalOnProperty(name = "btrack.ai.provider", havingValue = "gemini")
public class GeminiConfig {

    @Value("${btrack.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${btrack.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Value("${btrack.ai.gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${btrack.ai.gemini.vision-model:gemini-2.5-flash}")
    private String visionModel;

    @Value("${btrack.ai.gemini.max-tokens:800}")
    private int maxTokens;

    @Value("${btrack.ai.gemini.temperature:0.2}")
    private double temperature;

    @Bean
    public AiProvider aiProvider() {
        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-goog-api-key", apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        return new GeminiProvider(restClient, model, visionModel, maxTokens, temperature);
    }
}
