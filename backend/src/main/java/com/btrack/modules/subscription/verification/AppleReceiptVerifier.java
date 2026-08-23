package com.btrack.modules.subscription.verification;

import com.btrack.common.exception.BTrackException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestClient;

import java.security.PrivateKey;
import java.time.Instant;
import java.util.Date;

/**
 * Verifies an iOS purchase by asking Apple's App Store Server API directly,
 * rather than trusting the JWS transaction the client submits. We sign our own
 * short-lived JWT (ES256, App Store Connect API key) to authenticate to Apple;
 * Apple's response — fetched fresh, over TLS, using our credentials — is the
 * source of truth for productId/expiresAt/originalTransactionId.
 */
@Slf4j
@RequiredArgsConstructor
public class AppleReceiptVerifier {

    private final RestClient restClient;
    private final String keyId;
    private final String issuerId;
    private final String bundleId;
    private final PrivateKey privateKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public VerifiedPurchase verify(String signedTransaction) {
        if (privateKey == null) {
            throw BTrackException.purchaseVerificationFailed("Apple payments are not configured yet.");
        }
        String transactionId = extractTransactionId(signedTransaction);
        String jwt = buildAppStoreJwt();

        String responseBody;
        try {
            responseBody = restClient.get()
                    .uri("/inApps/v1/transactions/{transactionId}", transactionId)
                    .header("Authorization", "Bearer " + jwt)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("App Store Server API call failed", e);
            throw BTrackException.purchaseVerificationFailed("Could not verify purchase with Apple. Please try again.");
        }

        String signedTransactionInfo;
        try {
            signedTransactionInfo = objectMapper.readTree(responseBody).path("signedTransactionInfo").asText(null);
        } catch (Exception e) {
            throw BTrackException.purchaseVerificationFailed("Unexpected response from Apple.");
        }
        if (signedTransactionInfo == null) {
            throw BTrackException.purchaseVerificationFailed("Unexpected response from Apple.");
        }
        // This is Apple's authoritative, freshly-fetched transaction record.
        JsonNode envelope = JwsUtil.decodePayloadUnverified(signedTransactionInfo);

        // Fail closed: a response with no bundleId at all is not proof it belongs to
        // this app, so it must not be treated as if it does.
        String returnedBundleId = envelope.path("bundleId").asText(null);
        if (!bundleId.equals(returnedBundleId)) {
            throw BTrackException.purchaseVerificationFailed("Purchase belongs to a different app.");
        }

        // A refunded/reversed purchase still has a future expiresDate — Apple marks
        // it via revocationDate instead, so a valid-looking transaction must also be
        // checked for that or a refunded user keeps access until natural expiry.
        long revocationDateMs = envelope.path("revocationDate").asLong(0);
        if (revocationDateMs > 0) {
            throw BTrackException.purchaseVerificationFailed("This purchase has been refunded and is no longer valid.");
        }

        String originalTransactionId = envelope.path("originalTransactionId").asText(transactionId);
        long expiresMs = envelope.path("expiresDate").asLong(0);
        return new VerifiedPurchase(
                envelope.path("productId").asText(null),
                envelope.path("transactionId").asText(transactionId),
                originalTransactionId,
                expiresMs > 0 ? Instant.ofEpochMilli(expiresMs) : null,
                fetchAutoRenewStatus(originalTransactionId, jwt)
        );
    }

    /**
     * The transaction endpoint doesn't carry renewal intent — that lives on the
     * separate "Get All Subscription Statuses" endpoint's signedRenewalInfo JWS.
     * This is a best-effort secondary lookup: if it fails, we default to `true`
     * (the common case) rather than failing the whole purchase verification over it.
     */
    private boolean fetchAutoRenewStatus(String originalTransactionId, String jwt) {
        try {
            String body = restClient.get()
                    .uri("/inApps/v1/subscriptions/{originalTransactionId}", originalTransactionId)
                    .header("Authorization", "Bearer " + jwt)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(body);
            for (JsonNode group : root.path("data")) {
                for (JsonNode txn : group.path("lastTransactions")) {
                    String renewalJws = txn.path("signedRenewalInfo").asText(null);
                    if (renewalJws != null) {
                        JsonNode renewalInfo = JwsUtil.decodePayloadUnverified(renewalJws);
                        return renewalInfo.path("autoRenewStatus").asInt(1) == 1;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch Apple renewal status for {}, defaulting autoRenew=true", originalTransactionId, e);
        }
        return true;
    }

    private String extractTransactionId(String signedTransaction) {
        JsonNode payload = JwsUtil.decodePayloadUnverified(signedTransaction);
        String transactionId = payload.path("transactionId").asText(null);
        if (transactionId == null) {
            throw BTrackException.purchaseVerificationFailed("Malformed purchase receipt.");
        }
        return transactionId;
    }

    private String buildAppStoreJwt() {
        Instant now = Instant.now();
        return Jwts.builder()
                .header().keyId(keyId).and()
                .issuer(issuerId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(1200)))
                .audience().single("appstoreconnect-v1")
                .claim("bid", bundleId)
                .signWith(privateKey)
                .compact();
    }
}
