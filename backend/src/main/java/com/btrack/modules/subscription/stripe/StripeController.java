package com.btrack.modules.subscription.stripe;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions/stripe")
@RequiredArgsConstructor
@Tag(name = "Subscriptions — Stripe")
public class StripeController {

    private final StripeCheckoutService checkoutService;
    private final StripeWebhookService webhookService;

    @PostMapping("/checkout")
    @Operation(summary = "Create a Stripe Checkout session for a premium plan")
    public ResponseEntity<ApiResponse<Map<String, String>>> createCheckout(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "monthly") String plan) {
        String url = checkoutService.createCheckoutSession(principal.getUserId(), plan);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("checkoutUrl", url)));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook receiver (called by Stripe, not the app)")
    public ResponseEntity<Void> webhook(
            HttpServletRequest request,
            @RequestHeader("Stripe-Signature") String signature) throws IOException {
        String payload = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        webhookService.handle(payload, signature);
        return ResponseEntity.ok().build();
    }
}
