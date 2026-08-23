package com.btrack.modules.subscription.verification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.security.PrivateKey;

@Configuration
public class AppleConfig {

    @Value("${btrack.payments.apple.key-id:}")
    private String keyId;

    @Value("${btrack.payments.apple.issuer-id:}")
    private String issuerId;

    @Value("${btrack.payments.apple.bundle-id:}")
    private String bundleId;

    @Value("${btrack.payments.apple.private-key:}")
    private String privateKeyPem;

    @Value("${btrack.payments.apple.sandbox:true}")
    private boolean sandbox;

    @Bean
    public AppleReceiptVerifier appleReceiptVerifier() {
        String baseUrl = sandbox
                ? "https://api.storekit-sandbox.itunes.apple.com"
                : "https://api.storekit.itunes.apple.com";
        RestClient restClient = RestClient.builder().baseUrl(baseUrl).build();

        // Blank in dev until real App Store Connect credentials are configured —
        // AppleReceiptVerifier.verify() will fail loudly (not silently) if called
        // with no key configured, same posture as the AI providers before their keys existed.
        PrivateKey privateKey = privateKeyPem.isBlank()
                ? null
                : PemKeyUtil.loadPrivateKey(privateKeyPem, "EC");

        return new AppleReceiptVerifier(restClient, keyId, issuerId, bundleId, privateKey);
    }
}
