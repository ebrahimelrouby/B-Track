package com.btrack.modules.subscription.verification;

import java.time.Instant;

/** Store-confirmed purchase state — the only thing SubscriptionService is allowed to persist. */
public record VerifiedPurchase(
        String productId,
        String transactionId,
        String originalTransactionId,
        Instant expiresAt,
        boolean autoRenewing
) {}
