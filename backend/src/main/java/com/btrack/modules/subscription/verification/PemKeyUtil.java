package com.btrack.modules.subscription.verification;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

/** Loads the PKCS8 PEM private keys Apple (.p8, EC) and Google (service account JSON, RSA) hand out. */
final class PemKeyUtil {

    private PemKeyUtil() {}

    static PrivateKey loadPrivateKey(String pem, String algorithm) {
        try {
            String base64 = pem
                    .replaceAll("-----BEGIN (.*)-----", "")
                    .replaceAll("-----END (.*)-----", "")
                    .replaceAll("\\s", "");
            byte[] bytes = Base64.getDecoder().decode(base64);
            KeyFactory factory = KeyFactory.getInstance(algorithm);
            return factory.generatePrivate(new PKCS8EncodedKeySpec(bytes));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load " + algorithm + " private key", e);
        }
    }
}
