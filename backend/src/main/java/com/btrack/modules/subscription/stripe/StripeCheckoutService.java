package com.btrack.modules.subscription.stripe;

import com.btrack.common.exception.BTrackException;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class StripeCheckoutService {

    @Value("${btrack.payments.stripe.price-id-monthly:}")
    private String priceIdMonthly;

    @Value("${btrack.payments.stripe.price-id-annual:}")
    private String priceIdAnnual;

    @Value("${btrack.payments.stripe.success-url:https://btrack.app/checkout/success}")
    private String successUrl;

    @Value("${btrack.payments.stripe.cancel-url:https://btrack.app/checkout/cancel}")
    private String cancelUrl;

    /** Returns a Stripe-hosted Checkout URL for the given user/plan. */
    public String createCheckoutSession(UUID userId, String plan) {
        String priceId = "annual".equalsIgnoreCase(plan) ? priceIdAnnual : priceIdMonthly;
        if (priceId == null || priceId.isBlank()) {
            throw BTrackException.purchaseVerificationFailed("Stripe payments are not configured yet.");
        }

        Map<String, Object> params = Map.of(
                "mode", "subscription",
                "client_reference_id", userId.toString(),
                "line_items", List.of(Map.of("price", priceId, "quantity", 1)),
                "success_url", successUrl + "?session_id={CHECKOUT_SESSION_ID}",
                "cancel_url", cancelUrl
        );

        try {
            Session session = Session.create(params);
            return session.getUrl();
        } catch (StripeException e) {
            log.error("Stripe checkout session creation failed", e);
            throw BTrackException.purchaseVerificationFailed("Could not start checkout. Please try again.");
        }
    }
}
