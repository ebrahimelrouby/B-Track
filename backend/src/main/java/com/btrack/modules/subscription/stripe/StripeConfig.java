package com.btrack.modules.subscription.stripe;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    @Value("${btrack.payments.stripe.secret-key:}")
    private String secretKey;

    @PostConstruct
    public void init() {
        // Blank in dev until a real key is configured — Stripe SDK calls fail
        // loudly with an auth error at call time, same posture as the other
        // payment providers before their credentials exist.
        if (!secretKey.isBlank()) {
            Stripe.apiKey = secretKey;
        }
    }
}
