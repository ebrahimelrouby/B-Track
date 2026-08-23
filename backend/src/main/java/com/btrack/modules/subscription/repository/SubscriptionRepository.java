package com.btrack.modules.subscription.repository;

import com.btrack.modules.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByUserId(UUID userId);
    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<Subscription> findByStoreOriginalTransactionId(String storeOriginalTransactionId);
    Optional<Subscription> findByPurchaseToken(String purchaseToken);
}
