package com.btrack.modules.ai.provider.openai;

import com.btrack.modules.ai.provider.AiProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@ConditionalOnProperty(name = "btrack.ai.provider", havingValue = "openai", matchIfMissing = true)
public class OpenAiConfig {

    @Value("${btrack.ai.openai.api-key:}")
    private String apiKey;

    @Value("${btrack.ai.openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${btrack.ai.openai.model:gpt-4o}")
    private String model;

    @Value("${btrack.ai.openai.vision-model:gpt-4o}")
    private String visionModel;

    @Value("${btrack.ai.openai.max-tokens:800}")
    private int maxTokens;

    @Value("${btrack.ai.openai.temperature:0.2}")
    private double temperature;

    @Bean
    public AiProvider aiProvider() {
        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        return new OpenAiProvider(restClient, model, visionModel, maxTokens, temperature);
    }
}
