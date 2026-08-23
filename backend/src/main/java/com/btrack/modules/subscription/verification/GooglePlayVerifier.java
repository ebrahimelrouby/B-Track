package com.btrack.modules.subscription.verification;

import com.btrack.common.exception.BTrackException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.security.PrivateKey;
import java.time.Instant;
import java.util.Date;
import java.util.Set;

/**
 * Verifies an Android purchase via the Google Play Developer API's
 * subscriptionsv2 resource, rather than trusting the purchaseToken (or the
 * product/plan) the client submits at face value. We exchange a
 * service-account-signed JWT assertion for an OAuth2 access token (standard
 * RFC 7523 flow), then ask Google directly what this token actually paid for.
 *
 * subscriptionsv2 (unlike the older subscriptions.get) doesn't take a
 * productId in the request path at all — the productId in the returned
 * VerifiedPurchase comes entirely from Google's lineItems, so a client can't
 * influence which plan gets persisted. subscriptionState also tells us
 * whether the purchase is actually paid/active, not just "has an expiry in
 * the future" (a pending/on-hold purchase has that too).
 */
@Slf4j
@RequiredArgsConstructor
public class GooglePlayVerifier {

    private static final Set<String> ENTITLED_STATES = Set.of(
            "SUBSCRIPTION_STATE_ACTIVE",
            "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
            "SUBSCRIPTION_STATE_CANCELED"
    );

    private final RestClient oauthClient;
    private final RestClient publisherClient;
    private final String serviceAccountEmail;
    private final String tokenUri;
    private final PrivateKey privateKey;
    private final String packageName;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SCOPE = "https://www.googleapis.com/auth/androidpublisher";

    private volatile String cachedAccessToken;
    private volatile Instant cachedAccessTokenExpiresAt = Instant.EPOCH;

    public VerifiedPurchase verify(String purchaseToken) {
        if (privateKey == null) {
            throw BTrackException.purchaseVerificationFailed("Google Play payments are not configured yet.");
        }

        String accessToken = fetchAccessToken();

        String responseBody;
        try {
            responseBody = publisherClient.get()
                    .uri("/androidpublisher/v3/applications/{pkg}/purchases/subscriptionsv2/tokens/{token}",
                            packageName, purchaseToken)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Play Developer API call failed", e);
            throw BTrackException.purchaseVerificationFailed("Could not verify purchase with Google Play. Please try again.");
        }

        JsonNode purchase;
        try {
            purchase = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            throw BTrackException.purchaseVerificationFailed("Unexpected response from Google Play.");
        }

        String subscriptionState = purchase.path("subscriptionState").asText(null);
        if (!ENTITLED_STATES.contains(subscriptionState)) {
            throw BTrackException.purchaseVerificationFailed("This purchase is not currently active.");
        }

        JsonNode lineItems = purchase.path("lineItems");
        JsonNode lineItem = lineItems.isArray() && !lineItems.isEmpty() ? lineItems.get(0) : null;
        if (lineItem == null) {
            throw BTrackException.purchaseVerificationFailed("Unexpected response from Google Play.");
        }

        String productId = lineItem.path("productId").asText(null);
        Instant expiresAt = parseInstant(lineItem.path("expiryTime").asText(null));
        boolean autoRenewing = lineItem.path("autoRenewingPlan").path("autoRenewEnabled").asBoolean(false);
        String orderId = purchase.path("latestOrderId").asText(purchaseToken);

        return new VerifiedPurchase(productId, orderId, purchaseToken, expiresAt, autoRenewing);
    }

    private Instant parseInstant(String rfc3339) {
        if (rfc3339 == null || rfc3339.isBlank()) return null;
        try {
            return Instant.parse(rfc3339);
        } catch (Exception e) {
            return null;
        }
    }

    private synchronized String fetchAccessToken() {
        if (cachedAccessToken != null && Instant.now().isBefore(cachedAccessTokenExpiresAt)) {
            return cachedAccessToken;
        }

        Instant now = Instant.now();
        String assertion = Jwts.builder()
                .issuer(serviceAccountEmail)
                .audience().single(tokenUri)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(1800)))
                .claim("scope", SCOPE)
                .signWith(privateKey)
                .compact();

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
        form.add("assertion", assertion);

        String responseBody;
        try {
            responseBody = oauthClient.post()
                    .uri(tokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Google OAuth2 token exchange failed", e);
            throw BTrackException.purchaseVerificationFailed("Could not authenticate with Google Play. Please try again.");
        }

        try {
            JsonNode tokenResponse = objectMapper.readTree(responseBody);
            String accessToken = tokenResponse.path("access_token").asText(null);
            if (accessToken == null) {
                throw new IllegalStateException("No access_token in response");
            }
            // 60s safety margin so we never hand out a token that expires mid-flight.
            int expiresInSeconds = tokenResponse.path("expires_in").asInt(3600);
            cachedAccessToken = accessToken;
            cachedAccessTokenExpiresAt = now.plusSeconds(Math.max(0, expiresInSeconds - 60));
            return accessToken;
        } catch (Exception e) {
            throw BTrackException.purchaseVerificationFailed("Unexpected response from Google OAuth2.");
        }
    }
}
