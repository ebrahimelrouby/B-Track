package com.btrack.modules.subscription.stripe;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.entity.Subscription.SubscriptionPlan;
import com.btrack.modules.subscription.entity.Subscription.SubscriptionStatus;
import com.btrack.modules.subscription.repository.SubscriptionRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    @Value("${btrack.payments.stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${btrack.payments.stripe.price-id-monthly:}")
    private String priceIdMonthly;

    @Value("${btrack.payments.stripe.price-id-annual:}")
    private String priceIdAnnual;

    private final SubscriptionRepository subscriptionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // @Transactional lives here, not on processOnce(): processOnce() is only ever
    // called internally from this method, and Spring's proxy-based @Transactional
    // does nothing on self-invocation (a call that never goes through the proxy) —
    // it has to be on the method actually invoked from outside (StripeController).
    @Transactional
    public void handle(String payload, String signatureHeader) {
        if (webhookSecret.isBlank()) {
            throw BTrackException.purchaseVerificationFailed("Stripe payments are not configured yet.");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Rejected Stripe webhook with invalid signature");
            throw BTrackException.badRequest("Invalid webhook signature", ErrorCode.VALIDATION_ERROR);
        }

        processOnce(event, () -> route(event));
    }

    /**
     * Skips events we've already applied — Stripe redelivers on any non-2xx response
     * or timeout, and can redeliver concurrently. Claims the event via an atomic
     * INSERT ... ON CONFLICT DO NOTHING and only runs the handler if that insert
     * actually won the race; a check-then-act ordering here would let two
     * concurrent deliveries both pass an existsById() check before either commits.
     */
    private void processOnce(Event event, Runnable action) {
        int claimed = entityManager.createNativeQuery(
                        "INSERT INTO processed_webhook_events (event_id, source, processed_at) "
                                + "VALUES (?1, ?2, now()) ON CONFLICT (event_id) DO NOTHING")
                .setParameter(1, event.getId())
                .setParameter(2, "stripe")
                .executeUpdate();
        if (claimed == 0) {
            log.info("Ignoring already-processed (or concurrently-processing) Stripe event {}", event.getId());
            return;
        }
        action.run();
    }

    private void route(Event event) {
        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutCompleted(event);
            case "customer.subscription.updated" -> handleSubscriptionUpdated(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            default -> log.debug("Ignoring unhandled Stripe event type {}", event.getType());
        }
    }

    private void handleCheckoutCompleted(Event event) {
        Session session = deserialize(event, Session.class);
        if (session == null || session.getClientReferenceId() == null) {
            log.warn("checkout.session.completed with no client_reference_id — cannot map to a user");
            return;
        }

        UUID userId;
        try {
            userId = UUID.fromString(session.getClientReferenceId());
        } catch (IllegalArgumentException e) {
            log.warn("checkout.session.completed with malformed client_reference_id");
            return;
        }

        Subscription sub = subscriptionRepository.findByUserId(userId).orElse(null);
        if (sub == null) {
            log.warn("checkout.session.completed for unknown user {}", userId);
            return;
        }

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPlatform(Subscription.Platform.WEB);
        sub.setStripeCustomerId(session.getCustomer());
        sub.setStripeSubscriptionId(session.getSubscription());
        sub.setStartsAt(Instant.now());
        // Plan/expiry get filled in precisely by the customer.subscription.updated
        // event Stripe sends right after this one; default to monthly in the meantime.
        if (sub.getPlan() == SubscriptionPlan.FREE) {
            sub.setPlan(SubscriptionPlan.PREMIUM_MONTHLY);
        }
        subscriptionRepository.save(sub);
    }

    private void handleSubscriptionUpdated(Event event) {
        com.stripe.model.Subscription stripeSub = deserialize(event, com.stripe.model.Subscription.class);
        if (stripeSub == null) return;

        Subscription sub = subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).orElse(null);
        if (sub == null) {
            log.warn("customer.subscription.updated for unknown Stripe subscription {}", stripeSub.getId());
            return;
        }

        sub.setStatus("active".equals(stripeSub.getStatus()) || "trialing".equals(stripeSub.getStatus())
                ? SubscriptionStatus.ACTIVE
                : SubscriptionStatus.EXPIRED);

        SubscriptionItem item = stripeSub.getItems().getData().isEmpty() ? null : stripeSub.getItems().getData().get(0);
        if (item != null) {
            sub.setExpiresAt(Instant.ofEpochSecond(item.getCurrentPeriodEnd()));
            String priceId = item.getPrice() != null ? item.getPrice().getId() : null;
            if (priceId != null) {
                sub.setStoreProductId(priceId);
                // handleCheckoutCompleted defaults new subscriptions to PREMIUM_MONTHLY
                // sight-unseen; this is the event that actually knows which price the
                // user is paying, so it's the only place that can correct that guess.
                if (!priceIdAnnual.isBlank() && priceIdAnnual.equals(priceId)) {
                    sub.setPlan(SubscriptionPlan.PREMIUM_ANNUAL);
                } else if (!priceIdMonthly.isBlank() && priceIdMonthly.equals(priceId)) {
                    sub.setPlan(SubscriptionPlan.PREMIUM_MONTHLY);
                }
            }
        }
        sub.setAutoRenew(!Boolean.TRUE.equals(stripeSub.getCancelAtPeriodEnd()));
        subscriptionRepository.save(sub);
    }

    private void handleSubscriptionDeleted(Event event) {
        com.stripe.model.Subscription stripeSub = deserialize(event, com.stripe.model.Subscription.class);
        if (stripeSub == null) return;

        Subscription sub = subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId()).orElse(null);
        if (sub == null) return;

        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setCancelledAt(Instant.now());
        subscriptionRepository.save(sub);
    }

    @SuppressWarnings("unchecked")
    private <T extends StripeObject> T deserialize(Event event, Class<T> type) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        return (T) deserializer.getObject().orElse(null);
    }
}
