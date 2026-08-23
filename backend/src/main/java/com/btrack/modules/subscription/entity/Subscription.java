package com.btrack.modules.subscription.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "plan", nullable = false, columnDefinition = "subscription_plan")
    @Builder.Default
    private SubscriptionPlan plan = SubscriptionPlan.FREE;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "subscription_status")
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "platform", columnDefinition = "platform")
    private Platform platform;

    @Column(name = "store_product_id")
    private String storeProductId;

    @Column(name = "store_transaction_id", length = 500)
    private String storeTransactionId;

    // Apple identifies a subscription by this value across all of its renewals —
    // storeTransactionId changes every renewal, this doesn't.
    @Column(name = "store_original_transaction_id", length = 500)
    private String storeOriginalTransactionId;

    @Column(name = "purchase_token", columnDefinition = "TEXT")
    private String purchaseToken;

    @Column(name = "stripe_customer_id", length = 255)
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id", length = 255)
    private String stripeSubscriptionId;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "auto_renew")
    @Builder.Default
    private boolean autoRenew = true;

    public boolean isPremium() {
        return (plan == SubscriptionPlan.PREMIUM_MONTHLY || plan == SubscriptionPlan.PREMIUM_ANNUAL)
                && status == SubscriptionStatus.ACTIVE
                && (expiresAt == null || Instant.now().isBefore(expiresAt));
    }

    public enum SubscriptionPlan { FREE, PREMIUM_MONTHLY, PREMIUM_ANNUAL }
    public enum SubscriptionStatus { ACTIVE, EXPIRED, CANCELLED, GRACE_PERIOD, TRIAL }
    public enum Platform { IOS, ANDROID, WEB }

    public enum FeatureKey {
        UNLIMITED_WORKOUT_PLANS,
        UNLIMITED_CUSTOM_EXERCISES,
        ADVANCED_ANALYTICS,
        FULL_WORKOUT_HISTORY,
        AI_COACH,
        APPLE_WATCH_SYNC,
        UNLIMITED_PROGRESS_PHOTOS,
        ADVANCED_NUTRITION_TARGETS,
        MEAL_TEMPLATES,
        RECIPE_BUILDER,
        CUSTOM_WATER_PRESETS,
        DATA_EXPORT,
        PRIORITY_CLOUD_BACKUP,
        ADVANCED_PR_TRACKING,
        MUSCLE_GROUP_ANALYTICS,
        AI_FOOD_ESTIMATION,
        AI_BODY_FAT_ESTIMATION,
        RECOVERY_ADVANCED
    }
}
