package com.btrack.modules.subscription.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record VerifyPurchaseRequest(
        @NotBlank String platform,       // "ios" | "android"
        @NotBlank String plan,           // "monthly" | "annual"
        @NotBlank String transactionId,
        String purchaseToken,            // Android only
        String receiptData,              // iOS only
        Instant expiresAt
) {}
