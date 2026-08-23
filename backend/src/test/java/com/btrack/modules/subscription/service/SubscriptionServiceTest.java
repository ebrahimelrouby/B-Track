package com.btrack.modules.subscription.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.modules.subscription.dto.VerifyPurchaseRequest;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.repository.SubscriptionRepository;
import com.btrack.modules.subscription.verification.AppleReceiptVerifier;
import com.btrack.modules.subscription.verification.GooglePlayVerifier;
import com.btrack.modules.subscription.verification.VerifiedPurchase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers verifyAndActivate() — the method that used to blindly trust
 * client-submitted purchase data (a real security hole) and now only ever
 * persists what Apple/Google's servers confirm. Every test here is really
 * asking one question: does a lying client change what gets saved?
 */
@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock SubscriptionRepository subscriptionRepository;
    @Mock AppleReceiptVerifier appleReceiptVerifier;
    @Mock GooglePlayVerifier googlePlayVerifier;

    @InjectMocks SubscriptionService service;

    private final UUID userId = UUID.randomUUID();

    private Subscription freshSubscription() {
        Subscription sub = new Subscription();
        sub.setPlan(Subscription.SubscriptionPlan.FREE);
        sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        return sub;
    }

    @Test
    @DisplayName("verifyAndActivate: iOS purchase calls Apple and persists only the verified data")
    void verifyAndActivate_ios_persistsVerifiedData() {
        Subscription existing = freshSubscription();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant realExpiry = Instant.now().plusSeconds(2_592_000);
        VerifiedPurchase verified = new VerifiedPurchase(
                "com.btrack.premium.monthly", "real_txn_1", "real_orig_txn_1", realExpiry, true
        );
        when(appleReceiptVerifier.verify("the-real-jws-receipt")).thenReturn(verified);

        VerifyPurchaseRequest request = new VerifyPurchaseRequest("ios", "monthly", null, "the-real-jws-receipt");

        Subscription result = service.verifyAndActivate(userId, request);

        assertThat(result.getPlan()).isEqualTo(Subscription.SubscriptionPlan.PREMIUM_MONTHLY);
        assertThat(result.getStatus()).isEqualTo(Subscription.SubscriptionStatus.ACTIVE);
        assertThat(result.getPlatform()).isEqualTo(Subscription.Platform.IOS);
        assertThat(result.getStoreTransactionId()).isEqualTo("real_txn_1");
        assertThat(result.getStoreOriginalTransactionId()).isEqualTo("real_orig_txn_1");
        assertThat(result.getExpiresAt()).isEqualTo(realExpiry);
        verify(googlePlayVerifier, never()).verify(any());
    }

    @Test
    @DisplayName("verifyAndActivate: Android purchase calls Google Play and persists only the verified data")
    void verifyAndActivate_android_persistsVerifiedData() {
        Subscription existing = freshSubscription();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant realExpiry = Instant.now().plusSeconds(2_592_000);
        VerifiedPurchase verified = new VerifiedPurchase(
                "com.btrack.premium.annual", "GPA.real-order", "linked-token", realExpiry, false
        );
        when(googlePlayVerifier.verify("real-purchase-token")).thenReturn(verified);

        VerifyPurchaseRequest request = new VerifyPurchaseRequest("android", "annual", "real-purchase-token", null);

        Subscription result = service.verifyAndActivate(userId, request);

        assertThat(result.getPlan()).isEqualTo(Subscription.SubscriptionPlan.PREMIUM_ANNUAL);
        assertThat(result.getPlatform()).isEqualTo(Subscription.Platform.ANDROID);
        assertThat(result.getStoreTransactionId()).isEqualTo("GPA.real-order");
        assertThat(result.isAutoRenew()).isFalse();
        assertThat(result.getExpiresAt()).isEqualTo(realExpiry);
        verify(appleReceiptVerifier, never()).verify(any());
    }

    @Test
    @DisplayName("verifyAndActivate: iOS request with no receiptData is rejected before calling Apple")
    void verifyAndActivate_ios_missingReceiptData_throws() {
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(freshSubscription()));
        VerifyPurchaseRequest request = new VerifyPurchaseRequest("ios", "monthly", null, null);

        assertThatThrownBy(() -> service.verifyAndActivate(userId, request))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(appleReceiptVerifier, never()).verify(any());
    }

    @Test
    @DisplayName("verifyAndActivate: Android request with no purchaseToken is rejected before calling Google")
    void verifyAndActivate_android_missingPurchaseToken_throws() {
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(freshSubscription()));
        VerifyPurchaseRequest request = new VerifyPurchaseRequest("android", "monthly", null, null);

        assertThatThrownBy(() -> service.verifyAndActivate(userId, request))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(googlePlayVerifier, never()).verify(any());
    }

    @Test
    @DisplayName("verifyAndActivate: annual product id maps to PREMIUM_ANNUAL regardless of client's claimed plan")
    void verifyAndActivate_planDerivedFromVerifiedProductId_notClientClaim() {
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(freshSubscription()));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));

        // Client claims "monthly" but Apple's verified receipt says the annual product.
        VerifiedPurchase verified = new VerifiedPurchase(
                "com.btrack.premium.annual", "txn", "orig", Instant.now().plusSeconds(1000), true
        );
        when(appleReceiptVerifier.verify(any())).thenReturn(verified);
        VerifyPurchaseRequest request = new VerifyPurchaseRequest("ios", "monthly", null, "receipt");

        Subscription result = service.verifyAndActivate(userId, request);

        assertThat(result.getPlan()).isEqualTo(Subscription.SubscriptionPlan.PREMIUM_ANNUAL);
    }

    @Test
    @DisplayName("verifyAndActivate: verifier returning no productId is treated as a failed verification")
    void verifyAndActivate_verifierReturnsNoProductId_throws() {
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(freshSubscription()));
        VerifiedPurchase unverifiable = new VerifiedPurchase(null, null, null, null, false);
        when(appleReceiptVerifier.verify(any())).thenReturn(unverifiable);
        VerifyPurchaseRequest request = new VerifyPurchaseRequest("ios", "monthly", null, "receipt");

        assertThatThrownBy(() -> service.verifyAndActivate(userId, request))
                .isInstanceOf(BTrackException.class);
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyAndActivate: a receipt already linked to a different account's subscription is rejected")
    void verifyAndActivate_originalTransactionIdBelongsToAnotherUser_throws() {
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(freshSubscription()));

        VerifiedPurchase verified = new VerifiedPurchase(
                "com.btrack.premium.monthly", "txn", "orig-txn-already-used", Instant.now().plusSeconds(1000), true
        );
        when(appleReceiptVerifier.verify(any())).thenReturn(verified);

        com.btrack.modules.user.entity.User otherUser = new com.btrack.modules.user.entity.User();
        otherUser.setId(UUID.randomUUID());
        Subscription othersSubscription = freshSubscription();
        othersSubscription.setUser(otherUser);
        when(subscriptionRepository.findByStoreOriginalTransactionId("orig-txn-already-used"))
                .thenReturn(Optional.of(othersSubscription));

        VerifyPurchaseRequest request = new VerifyPurchaseRequest("ios", "monthly", null, "receipt");

        assertThatThrownBy(() -> service.verifyAndActivate(userId, request))
                .isInstanceOf(BTrackException.class);
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("verifyAndActivate: re-verifying the same receipt for the same account (renewal) is allowed")
    void verifyAndActivate_originalTransactionIdBelongsToSameUser_allowed() {
        Subscription existing = freshSubscription();
        com.btrack.modules.user.entity.User self = new com.btrack.modules.user.entity.User();
        self.setId(userId);
        existing.setUser(self);
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));

        VerifiedPurchase verified = new VerifiedPurchase(
                "com.btrack.premium.monthly", "txn-2", "orig-txn-mine", Instant.now().plusSeconds(1000), true
        );
        when(appleReceiptVerifier.verify(any())).thenReturn(verified);
        when(subscriptionRepository.findByStoreOriginalTransactionId("orig-txn-mine")).thenReturn(Optional.of(existing));

        VerifyPurchaseRequest request = new VerifyPurchaseRequest("ios", "monthly", null, "receipt");

        Subscription result = service.verifyAndActivate(userId, request);

        assertThat(result.getStoreOriginalTransactionId()).isEqualTo("orig-txn-mine");
    }
}
