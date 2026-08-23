package com.btrack.modules.subscription.verification;

import com.btrack.common.exception.BTrackException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * These tests never talk to real Apple servers — MockRestServiceServer
 * intercepts the RestClient calls, and the "receipt"/"App Store response" are
 * hand-built fake JWS strings (real base64url structure, arbitrary signature
 * bytes) since AppleReceiptVerifier deliberately never verifies a JWS
 * signature itself — see JwsUtil's doc comment for why.
 */
class AppleReceiptVerifierTest {

    private static final String BUNDLE_ID = "com.btrack.test";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private MockRestServiceServer mockServer;
    private AppleReceiptVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.storekit-sandbox.itunes.apple.com");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        KeyPairGenerator gen = KeyPairGenerator.getInstance("EC");
        KeyPair keyPair = gen.generateKeyPair();

        verifier = new AppleReceiptVerifier(restClient, "test-key-id", "test-issuer-id", BUNDLE_ID, keyPair.getPrivate());
    }

    private static String fakeJws(Map<String, Object> payload) {
        try {
            String header = base64Url(MAPPER.writeValueAsBytes(Map.of("alg", "ES256", "typ", "JWT")));
            String body = base64Url(MAPPER.writeValueAsBytes(payload));
            return header + "." + body + ".fake-signature";
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Fake signedRenewalInfo JWS wrapped in the "Get All Subscription Statuses" response shape. */
    private static String fakeSubscriptionStatusResponse(int autoRenewStatus) {
        String renewalJws = fakeJws(Map.of("autoRenewStatus", autoRenewStatus));
        try {
            return MAPPER.writeValueAsString(Map.of(
                    "data", java.util.List.of(Map.of(
                            "lastTransactions", java.util.List.of(Map.of("signedRenewalInfo", renewalJws))
                    ))
            ));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("verify: successful App Store response returns the verified purchase")
    void verify_success_returnsVerifiedPurchase() {
        String clientReceipt = fakeJws(Map.of("transactionId", "txn_123"));
        String appStoreEnvelope = fakeJws(Map.of(
                "bundleId", BUNDLE_ID,
                "productId", "com.btrack.premium.annual",
                "transactionId", "txn_123",
                "originalTransactionId", "orig_txn_001",
                "expiresDate", 1_800_000_000_000L
        ));
        String responseBody;
        try {
            responseBody = MAPPER.writeValueAsString(Map.of("signedTransactionInfo", appStoreEnvelope));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        mockServer.expect(requestTo("https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/txn_123"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andExpect(header("Authorization", org.hamcrest.Matchers.startsWith("Bearer ")))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));
        mockServer.expect(requestTo("https://api.storekit-sandbox.itunes.apple.com/inApps/v1/subscriptions/orig_txn_001"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andRespond(withSuccess(fakeSubscriptionStatusResponse(0), MediaType.APPLICATION_JSON));

        VerifiedPurchase result = verifier.verify(clientReceipt);

        assertThat(result.productId()).isEqualTo("com.btrack.premium.annual");
        assertThat(result.transactionId()).isEqualTo("txn_123");
        assertThat(result.originalTransactionId()).isEqualTo("orig_txn_001");
        assertThat(result.expiresAt()).isEqualTo(java.time.Instant.ofEpochMilli(1_800_000_000_000L));
        // autoRenewStatus=0 in the fake renewal-info response above — confirms this is
        // genuinely read from Apple's data, not hardcoded to true.
        assertThat(result.autoRenewing()).isFalse();
        mockServer.verify();
    }

    @Test
    @DisplayName("verify: App Store response for a different app's bundle ID is rejected")
    void verify_bundleIdMismatch_throws() {
        String clientReceipt = fakeJws(Map.of("transactionId", "txn_456"));
        String appStoreEnvelope = fakeJws(Map.of(
                "bundleId", "com.someoneelse.app",
                "productId", "com.btrack.premium.monthly",
                "transactionId", "txn_456"
        ));
        String responseBody;
        try {
            responseBody = MAPPER.writeValueAsString(Map.of("signedTransactionInfo", appStoreEnvelope));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("txn_456")))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> verifier.verify(clientReceipt))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    @DisplayName("verify: App Store response with no bundleId field at all is rejected (fails closed)")
    void verify_bundleIdMissing_throws() {
        String clientReceipt = fakeJws(Map.of("transactionId", "txn_no_bundle"));
        // Deliberately no "bundleId" key at all.
        String appStoreEnvelope = fakeJws(Map.of(
                "productId", "com.btrack.premium.monthly",
                "transactionId", "txn_no_bundle"
        ));
        String responseBody;
        try {
            responseBody = MAPPER.writeValueAsString(Map.of("signedTransactionInfo", appStoreEnvelope));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("txn_no_bundle")))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> verifier.verify(clientReceipt))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    @DisplayName("verify: a revoked (refunded) transaction is rejected even though it's otherwise well-formed")
    void verify_revokedTransaction_throws() {
        String clientReceipt = fakeJws(Map.of("transactionId", "txn_refunded"));
        String appStoreEnvelope = fakeJws(Map.of(
                "bundleId", BUNDLE_ID,
                "productId", "com.btrack.premium.monthly",
                "transactionId", "txn_refunded",
                "originalTransactionId", "orig_txn_refunded",
                "expiresDate", 1_800_000_000_000L,
                "revocationDate", 1_700_000_000_000L
        ));
        String responseBody;
        try {
            responseBody = MAPPER.writeValueAsString(Map.of("signedTransactionInfo", appStoreEnvelope));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("txn_refunded")))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> verifier.verify(clientReceipt))
                .isInstanceOf(BTrackException.class)
                .hasMessageContaining("refunded");
    }

    @Test
    @DisplayName("verify: App Store Server API error surfaces as a purchase verification failure")
    void verify_httpError_throws() {
        String clientReceipt = fakeJws(Map.of("transactionId", "txn_789"));

        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("txn_789")))
                .andRespond(withServerError());

        assertThatThrownBy(() -> verifier.verify(clientReceipt))
                .isInstanceOf(BTrackException.class)
                .hasMessageContaining("Apple");
    }

    @Test
    @DisplayName("verify: malformed client receipt with no transactionId is rejected before any HTTP call")
    void verify_malformedClientReceipt_throws() {
        String clientReceipt = fakeJws(Map.of("somethingElse", "value"));

        assertThatThrownBy(() -> verifier.verify(clientReceipt))
                .isInstanceOf(BTrackException.class);

        mockServer.verify(); // no requests expected/made
    }

    @Test
    @DisplayName("verify: unconfigured Apple credentials fail loudly instead of NPE-ing inside jjwt")
    void verify_noPrivateKeyConfigured_throwsClearError() {
        RestClient restClient = RestClient.builder().build();
        AppleReceiptVerifier unconfigured = new AppleReceiptVerifier(restClient, "", "", BUNDLE_ID, null);

        assertThatThrownBy(() -> unconfigured.verify(fakeJws(Map.of("transactionId", "x"))))
                .isInstanceOf(BTrackException.class)
                .hasMessageContaining("not configured");
    }
}
