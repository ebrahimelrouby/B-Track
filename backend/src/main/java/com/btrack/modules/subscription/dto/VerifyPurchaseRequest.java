package com.btrack.modules.subscription.dto;

import jakarta.validation.constraints.NotBlank;

// transactionId/expiresAt are deliberately absent: verifyAndActivate() only ever
// persists what Apple/Google's own servers report (via VerifiedPurchase), so a
// client-submitted transaction id or expiry would just be dead input.
public record VerifyPurchaseRequest(
        @NotBlank String platform,       // "ios" | "android"
        @NotBlank String plan,           // "monthly" | "annual"
        String purchaseToken,            // Android only
        String receiptData               // iOS only
) {}
