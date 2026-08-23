package com.btrack.modules.subscription.verification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.security.PrivateKey;

@Configuration
public class GoogleConfig {

    @Value("${btrack.payments.google.package-name:}")
    private String packageName;

    // Raw service account JSON contents (not a file path) — same "paste the
    // secret into an env var" posture as every other credential in this app.
    @Value("${btrack.payments.google.service-account-json:}")
    private String serviceAccountJson;

    @Bean
    public GooglePlayVerifier googlePlayVerifier() {
        RestClient oauthClient = RestClient.builder().build();
        RestClient publisherClient = RestClient.builder()
                .baseUrl("https://androidpublisher.googleapis.com")
                .build();

        if (serviceAccountJson.isBlank()) {
            // Blank in dev until a real service account is configured — verify()
            // fails loudly with a clear message rather than silently misbehaving.
            return new GooglePlayVerifier(oauthClient, publisherClient, null, null, null, packageName);
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode credentials = mapper.readTree(serviceAccountJson);
            String clientEmail = credentials.path("client_email").asText();
            String tokenUri = credentials.path("token_uri").asText("https://oauth2.googleapis.com/token");
            PrivateKey privateKey = PemKeyUtil.loadPrivateKey(credentials.path("private_key").asText(), "RSA");
            return new GooglePlayVerifier(oauthClient, publisherClient, clientEmail, tokenUri, privateKey, packageName);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid btrack.payments.google.service-account-json", e);
        }
    }
}
