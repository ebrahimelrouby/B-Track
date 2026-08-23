package com.btrack.modules.subscription.stripe;

import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.repository.SubscriptionRepository;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the real Spring context (real Flyway migrations, real Postgres via
 * Testcontainers, real webhook signature verification) end-to-end — the same
 * scenario proven manually with a hand-signed payload while building this
 * feature, now pinned down as a repeatable test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class StripeWebhookIntegrationTest {

    private static final String WEBHOOK_SECRET = "whsec_integration_test_secret";

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("btrack_test")
            .withUsername("btrack")
            .withPassword("btrack");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("btrack.payments.stripe.webhook-secret", () -> WEBHOOK_SECRET);
    }

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired SubscriptionRepository subscriptionRepository;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private UUID userId;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .email("stripe-webhook-" + UUID.randomUUID() + "@btrack.test")
                .passwordHash("not-a-real-hash")
                .firstName("Webhook")
                .lastName("Tester")
                .build());
        userId = user.getId();

        subscriptionRepository.save(Subscription.builder()
                .user(user)
                .plan(Subscription.SubscriptionPlan.FREE)
                .status(Subscription.SubscriptionStatus.ACTIVE)
                .build());
    }

    private byte[] checkoutCompletedPayload(String eventId, String sessionId) throws Exception {
        Map<String, Object> payload = Map.of(
                "id", eventId,
                "object", "event",
                "api_version", "2025-06-30.basil",
                "type", "checkout.session.completed",
                "data", Map.of("object", Map.of(
                        "id", sessionId,
                        "object", "checkout.session",
                        "client_reference_id", userId.toString(),
                        "customer", "cus_" + sessionId,
                        "subscription", "sub_" + sessionId,
                        "mode", "subscription",
                        "payment_status", "paid"
                ))
        );
        return MAPPER.writeValueAsBytes(payload);
    }

    private String signaturePayload(byte[] body, String secret) throws Exception {
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        byte[] signedPayload = (timestamp + ".").getBytes(StandardCharsets.UTF_8);
        byte[] fullPayload = new byte[signedPayload.length + body.length];
        System.arraycopy(signedPayload, 0, fullPayload, 0, signedPayload.length);
        System.arraycopy(body, 0, fullPayload, signedPayload.length, body.length);

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = HexFormat.of().formatHex(mac.doFinal(fullPayload));
        return "t=" + timestamp + ",v1=" + signature;
    }

    @Test
    @DisplayName("checkout.session.completed with a valid signature activates the subscription")
    void webhook_validSignature_activatesSubscription() throws Exception {
        byte[] body = checkoutCompletedPayload("evt_it_" + UUID.randomUUID(), "cs_it_1");
        String signature = signaturePayload(body, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/subscriptions/stripe/webhook")
                        .content(body)
                        .contentType("application/json")
                        .header("Stripe-Signature", signature))
                .andExpect(status().isOk());

        Optional<Subscription> updated = subscriptionRepository.findByUserId(userId);
        assertThat(updated).isPresent();
        assertThat(updated.get().getStatus()).isEqualTo(Subscription.SubscriptionStatus.ACTIVE);
        assertThat(updated.get().getPlatform()).isEqualTo(Subscription.Platform.WEB);
        assertThat(updated.get().getStripeCustomerId()).isEqualTo("cus_cs_it_1");
        assertThat(updated.get().getStripeSubscriptionId()).isEqualTo("sub_cs_it_1");
    }

    @Test
    @DisplayName("Replaying the same event id is a no-op — idempotency guard prevents double-processing")
    void webhook_replayedEvent_isNoOp() throws Exception {
        String eventId = "evt_it_replay_" + UUID.randomUUID();
        byte[] body = checkoutCompletedPayload(eventId, "cs_it_2");
        String signature = signaturePayload(body, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/subscriptions/stripe/webhook")
                        .content(body).contentType("application/json").header("Stripe-Signature", signature))
                .andExpect(status().isOk());

        // Tamper with the persisted state the same way a test would to prove a
        // second delivery doesn't touch it again.
        Subscription sub = subscriptionRepository.findByUserId(userId).orElseThrow();
        sub.setStripeCustomerId("manually-set-sentinel");
        subscriptionRepository.save(sub);

        String secondSignature = signaturePayload(body, WEBHOOK_SECRET);
        mockMvc.perform(post("/api/v1/subscriptions/stripe/webhook")
                        .content(body).contentType("application/json").header("Stripe-Signature", secondSignature))
                .andExpect(status().isOk());

        Subscription afterReplay = subscriptionRepository.findByUserId(userId).orElseThrow();
        assertThat(afterReplay.getStripeCustomerId()).isEqualTo("manually-set-sentinel");
    }

    @Test
    @DisplayName("A forged signature is rejected and the subscription is left untouched")
    void webhook_invalidSignature_rejected() throws Exception {
        byte[] body = checkoutCompletedPayload("evt_it_bad_sig_" + UUID.randomUUID(), "cs_it_3");
        String signatureFromWrongSecret = signaturePayload(body, "whsec_not_the_real_secret");

        mockMvc.perform(post("/api/v1/subscriptions/stripe/webhook")
                        .content(body).contentType("application/json").header("Stripe-Signature", signatureFromWrongSecret))
                .andExpect(status().isBadRequest());

        Subscription unchanged = subscriptionRepository.findByUserId(userId).orElseThrow();
        assertThat(unchanged.getPlatform()).isNull();
        assertThat(unchanged.getStatus()).isEqualTo(Subscription.SubscriptionStatus.ACTIVE);
        assertThat(unchanged.getPlan()).isEqualTo(Subscription.SubscriptionPlan.FREE);
    }
}
