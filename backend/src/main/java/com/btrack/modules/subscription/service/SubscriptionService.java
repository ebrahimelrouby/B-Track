package com.btrack.modules.subscription.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.subscription.dto.EntitlementResponse;
import com.btrack.modules.subscription.dto.VerifyPurchaseRequest;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.entity.Subscription.FeatureKey;
import com.btrack.modules.subscription.entity.Subscription.SubscriptionPlan;
import com.btrack.modules.subscription.repository.SubscriptionRepository;
import com.btrack.modules.subscription.verification.AppleReceiptVerifier;
import com.btrack.modules.subscription.verification.GooglePlayVerifier;
import com.btrack.modules.subscription.verification.VerifiedPurchase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    // Premium features — all FeatureKeys that require premium
    private static final Set<FeatureKey> PREMIUM_FEATURES = Set.of(FeatureKey.values());

    // Free plan limits
    private static final int FREE_MAX_WORKOUT_PLANS = 3;
    private static final int FREE_MAX_CUSTOM_EXERCISES = 10;
    private static final int FREE_MAX_PROGRESS_PHOTOS = 5;
    private static final int FREE_WORKOUT_HISTORY_DAYS = 30;

    private final SubscriptionRepository subscriptionRepository;
    private final AppleReceiptVerifier appleReceiptVerifier;
    private final GooglePlayVerifier googlePlayVerifier;

    public Subscription getSubscription(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> BTrackException.notFound("Subscription not found", ErrorCode.SUBSCRIPTION_NOT_FOUND));
    }

    public EntitlementResponse getEntitlements(UUID userId) {
        Subscription sub = getSubscription(userId);
        boolean premium = sub.isPremium();

        Set<String> features = premium
                ? Arrays.stream(FeatureKey.values()).map(Enum::name).collect(Collectors.toSet())
                : Set.of();

        return new EntitlementResponse(
                sub.getPlan().name(),
                sub.getStatus().name(),
                premium,
                features,
                sub.getExpiresAt(),
                premium ? -1 : FREE_MAX_WORKOUT_PLANS,
                premium ? -1 : FREE_MAX_CUSTOM_EXERCISES,
                premium ? -1 : FREE_MAX_PROGRESS_PHOTOS,
                premium ? -1 : FREE_WORKOUT_HISTORY_DAYS
        );
    }

    public void requireFeature(UUID userId, FeatureKey feature) {
        Subscription sub = getSubscription(userId);
        if (!sub.isPremium()) {
            throw BTrackException.featureLocked(feature.name().replace('_', ' ').toLowerCase());
        }
    }

    public void requireWithinLimit(UUID userId, String resource, int currentCount) {
        Subscription sub = getSubscription(userId);
        if (sub.isPremium()) return;

        int limit = switch (resource) {
            case "workout_plans" -> FREE_MAX_WORKOUT_PLANS;
            case "custom_exercises" -> FREE_MAX_CUSTOM_EXERCISES;
            case "progress_photos" -> FREE_MAX_PROGRESS_PHOTOS;
            default -> Integer.MAX_VALUE;
        };

        if (currentCount >= limit) {
            throw BTrackException.planLimitReached(resource.replace('_', ' '));
        }
    }

    @Transactional
    public Subscription verifyAndActivate(UUID userId, VerifyPurchaseRequest request) {
        Subscription sub = getSubscription(userId);
        boolean isIos = "ios".equalsIgnoreCase(request.platform());

        // Server-side verification is the whole point here — everything written to
        // `sub` below comes from the store's own response, never from the client's
        // request. A client can lie about `plan`/`expiresAt`; it can't forge what
        // Apple/Google tell us directly.
        VerifiedPurchase verified = isIos
                ? appleReceiptVerifier.verify(requireReceiptData(request))
                : googlePlayVerifier.verify(requirePurchaseToken(request));

        if (verified.productId() == null) {
            throw BTrackException.purchaseVerificationFailed("Purchase could not be verified.");
        }

        // A genuine, store-verified purchase can still belong to someone else — a
        // leaked/shared/replayed receipt or purchaseToken must not grant premium to
        // a second account off the same underlying purchase.
        String ownershipKey = isIos ? verified.originalTransactionId() : request.purchaseToken();
        if (ownershipKey != null) {
            Optional<Subscription> existingOwner = isIos
                    ? subscriptionRepository.findByStoreOriginalTransactionId(ownershipKey)
                    : subscriptionRepository.findByPurchaseToken(ownershipKey);
            if (existingOwner.isPresent() && !existingOwner.get().getUser().getId().equals(userId)) {
                throw BTrackException.purchaseVerificationFailed("This purchase is already linked to another account.");
            }
        }

        sub.setPlan(planForProductId(verified.productId()));
        sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        sub.setPlatform(isIos ? Subscription.Platform.IOS : Subscription.Platform.ANDROID);
        sub.setStoreProductId(verified.productId());
        sub.setStoreTransactionId(verified.transactionId());
        sub.setStoreOriginalTransactionId(verified.originalTransactionId());
        sub.setPurchaseToken(request.purchaseToken());
        sub.setAutoRenew(verified.autoRenewing());
        sub.setStartsAt(sub.getStartsAt() == null ? Instant.now() : sub.getStartsAt());
        sub.setExpiresAt(verified.expiresAt());

        return subscriptionRepository.save(sub);
    }

    private SubscriptionPlan planForProductId(String productId) {
        return productId.toLowerCase().contains("annual") ? SubscriptionPlan.PREMIUM_ANNUAL : SubscriptionPlan.PREMIUM_MONTHLY;
    }

    private String requireReceiptData(VerifyPurchaseRequest request) {
        if (request.receiptData() == null || request.receiptData().isBlank()) {
            throw BTrackException.badRequest("receiptData is required for iOS purchases", ErrorCode.VALIDATION_ERROR);
        }
        return request.receiptData();
    }

    private String requirePurchaseToken(VerifyPurchaseRequest request) {
        if (request.purchaseToken() == null || request.purchaseToken().isBlank()) {
            throw BTrackException.badRequest("purchaseToken is required for Android purchases", ErrorCode.VALIDATION_ERROR);
        }
        return request.purchaseToken();
    }
}
