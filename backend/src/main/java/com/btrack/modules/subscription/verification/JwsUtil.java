package com.btrack.modules.subscription.verification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Base64;

/**
 * Decodes the payload segment of a signed JWS without verifying its signature.
 *
 * We don't hold Apple's or Google's public signing certificates locally, so we
 * can't verify these JWS tokens the way jjwt normally would. Instead the trust
 * boundary is the HTTPS call itself: the App Store Server API / Play Developer
 * API calls (see AppleReceiptVerifier / GooglePlayVerifier) are made directly
 * to Apple/Google over TLS using our own signed credentials, and it's *that*
 * authenticated response we trust — this decode is only ever used to read a
 * field (like transactionId) out of a token we already got via that trusted
 * channel, or to pull a routing hint (transactionId) out of the client's
 * submitted token before we've verified anything about it.
 *
 * For full defense-in-depth beyond this trust model, integrate Apple's official
 * app-store-server-library, which validates the x5c certificate chain against
 * Apple's root CA locally.
 */
final class JwsUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JwsUtil() {}

    static JsonNode decodePayloadUnverified(String jws) {
        String[] parts = jws.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Not a valid JWS: expected 3 dot-separated segments");
        }
        try {
            byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
            return MAPPER.readTree(payload);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to decode JWS payload", e);
        }
    }
}
