package com.btrack.modules.subscription.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.subscription.dto.EntitlementResponse;
import com.btrack.modules.subscription.dto.VerifyPurchaseRequest;
import com.btrack.modules.subscription.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/entitlements")
    @Operation(summary = "Get current user's subscription entitlements")
    public ResponseEntity<ApiResponse<EntitlementResponse>> getEntitlements(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getEntitlements(principal.getUserId())));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify and activate an in-app purchase")
    public ResponseEntity<ApiResponse<EntitlementResponse>> verifyPurchase(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody VerifyPurchaseRequest request) {
        subscriptionService.verifyAndActivate(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok(
                "Subscription activated",
                subscriptionService.getEntitlements(principal.getUserId())
        ));
    }
}
