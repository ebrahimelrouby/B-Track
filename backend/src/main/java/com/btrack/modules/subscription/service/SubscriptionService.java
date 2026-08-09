package com.btrack.modules.subscription.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.subscription.dto.EntitlementResponse;
import com.btrack.modules.subscription.dto.VerifyPurchaseRequest;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.entity.Subscription.FeatureKey;
import com.btrack.modules.subscription.entity.Subscription.SubscriptionPlan;
import com.btrack.modules.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
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

        // In production: verify receipt with Apple/Google servers
        // Here we apply the verified state
        sub.setPlan(request.plan().contains("annual") ? SubscriptionPlan.PREMIUM_ANNUAL : SubscriptionPlan.PREMIUM_MONTHLY);
        sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        sub.setPlatform(request.platform().equals("ios") ? Subscription.Platform.IOS : Subscription.Platform.ANDROID);
        sub.setStoreTransactionId(request.transactionId());
        sub.setPurchaseToken(request.purchaseToken());
        sub.setStartsAt(Instant.now());
        sub.setExpiresAt(request.expiresAt());

        return subscriptionRepository.save(sub);
    }
}
