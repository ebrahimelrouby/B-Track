package com.btrack.modules.subscription.verification;

import com.btrack.common.exception.BTrackException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GooglePlayVerifierTest {

    private static final String PACKAGE_NAME = "com.btrackscaffold";
    private static final String TOKEN_URI = "https://oauth2.googleapis.com/token";
    private static final String PURCHASE_URL =
            "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + PACKAGE_NAME
                    + "/purchases/subscriptionsv2/tokens/token-xyz";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private MockRestServiceServer oauthMockServer;
    private MockRestServiceServer publisherMockServer;
    private GooglePlayVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        RestClient.Builder oauthBuilder = RestClient.builder();
        oauthMockServer = MockRestServiceServer.bindTo(oauthBuilder).build();
        RestClient oauthClient = oauthBuilder.build();

        RestClient.Builder publisherBuilder = RestClient.builder().baseUrl("https://androidpublisher.googleapis.com");
        publisherMockServer = MockRestServiceServer.bindTo(publisherBuilder).build();
        RestClient publisherClient = publisherBuilder.build();

        KeyPair keyPair = KeyPairGenerator.getInstance("RSA").generateKeyPair();

        verifier = new GooglePlayVerifier(
                oauthClient, publisherClient, "test@test.iam.gserviceaccount.com", TOKEN_URI,
                keyPair.getPrivate(), PACKAGE_NAME
        );
    }

    private void expectTokenExchange() throws Exception {
        String tokenResponse = MAPPER.writeValueAsString(Map.of("access_token", "fake-access-token", "expires_in", 3600));
        oauthMockServer.expect(requestTo(TOKEN_URI))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andRespond(withSuccess(tokenResponse, MediaType.APPLICATION_JSON));
    }

    private String subscriptionV2Response(String subscriptionState, String productId, boolean autoRenew) throws Exception {
        return MAPPER.writeValueAsString(Map.of(
                "kind", "androidpublisher#subscriptionPurchaseV2",
                "subscriptionState", subscriptionState,
                "latestOrderId", "GPA.1234-5678",
                "lineItems", java.util.List.of(Map.of(
                        "productId", productId,
                        "expiryTime", "2027-01-01T00:00:00Z",
                        "autoRenewingPlan", Map.of("autoRenewEnabled", autoRenew)
                ))
        ));
    }

    @Test
    @DisplayName("verify: active subscription returns the store-confirmed productId, not a client-supplied one")
    void verify_active_returnsVerifiedPurchase() throws Exception {
        expectTokenExchange();
        publisherMockServer.expect(requestTo(PURCHASE_URL))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andRespond(withSuccess(
                        subscriptionV2Response("SUBSCRIPTION_STATE_ACTIVE", "com.btrack.premium.annual", true),
                        MediaType.APPLICATION_JSON));

        VerifiedPurchase result = verifier.verify("token-xyz");

        assertThat(result.productId()).isEqualTo("com.btrack.premium.annual");
        assertThat(result.transactionId()).isEqualTo("GPA.1234-5678");
        assertThat(result.originalTransactionId()).isEqualTo("token-xyz");
        assertThat(result.autoRenewing()).isTrue();
        assertThat(result.expiresAt()).isEqualTo(java.time.Instant.parse("2027-01-01T00:00:00Z"));
        oauthMockServer.verify();
        publisherMockServer.verify();
    }

    @Test
    @DisplayName("verify: SUBSCRIPTION_STATE_ON_HOLD (payment failed) is rejected, not treated as active")
    void verify_onHold_throws() throws Exception {
        expectTokenExchange();
        publisherMockServer.expect(requestTo(PURCHASE_URL))
                .andRespond(withSuccess(
                        subscriptionV2Response("SUBSCRIPTION_STATE_ON_HOLD", "com.btrack.premium.monthly", true),
                        MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> verifier.verify("token-xyz"))
                .isInstanceOf(BTrackException.class);
    }

    @Test
    @DisplayName("verify: SUBSCRIPTION_STATE_PENDING (payment not yet confirmed) is rejected")
    void verify_pending_throws() throws Exception {
        expectTokenExchange();
        publisherMockServer.expect(requestTo(PURCHASE_URL))
                .andRespond(withSuccess(
                        subscriptionV2Response("SUBSCRIPTION_STATE_PENDING", "com.btrack.premium.monthly", true),
                        MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> verifier.verify("token-xyz"))
                .isInstanceOf(BTrackException.class);
    }

    @Test
    @DisplayName("verify: OAuth2 token exchange failure surfaces as a purchase verification failure")
    void verify_tokenExchangeFails_throws() {
        oauthMockServer.expect(requestTo(TOKEN_URI)).andRespond(withServerError());

        assertThatThrownBy(() -> verifier.verify("token-xyz"))
                .isInstanceOf(BTrackException.class)
                .hasMessageContaining("Google");
    }

    @Test
    @DisplayName("verify: Play Developer API error surfaces as a purchase verification failure")
    void verify_publisherApiError_throws() throws Exception {
        expectTokenExchange();
        publisherMockServer.expect(requestTo(org.hamcrest.Matchers.containsString("token-xyz")))
                .andRespond(withServerError());

        assertThatThrownBy(() -> verifier.verify("token-xyz"))
                .isInstanceOf(BTrackException.class);
    }

    @Test
    @DisplayName("verify: a second call within the token's lifetime reuses the cached access token")
    void verify_secondCall_reusesCachedAccessToken() throws Exception {
        expectTokenExchange(); // only ONE token-exchange expectation for two verify() calls
        publisherMockServer.expect(requestTo(PURCHASE_URL))
                .andRespond(withSuccess(
                        subscriptionV2Response("SUBSCRIPTION_STATE_ACTIVE", "com.btrack.premium.monthly", true),
                        MediaType.APPLICATION_JSON));
        publisherMockServer.expect(requestTo(PURCHASE_URL))
                .andRespond(withSuccess(
                        subscriptionV2Response("SUBSCRIPTION_STATE_ACTIVE", "com.btrack.premium.monthly", true),
                        MediaType.APPLICATION_JSON));

        verifier.verify("token-xyz");
        verifier.verify("token-xyz");

        oauthMockServer.verify();
        publisherMockServer.verify();
    }

    @Test
    @DisplayName("verify: unconfigured Google credentials fail loudly instead of NPE-ing inside jjwt")
    void verify_noPrivateKeyConfigured_throwsClearError() {
        RestClient oauthClient = RestClient.builder().build();
        RestClient publisherClient = RestClient.builder().build();
        GooglePlayVerifier unconfigured = new GooglePlayVerifier(
                oauthClient, publisherClient, null, null, null, PACKAGE_NAME
        );

        assertThatThrownBy(() -> unconfigured.verify("token-xyz"))
                .isInstanceOf(BTrackException.class)
                .hasMessageContaining("not configured");
    }
}
