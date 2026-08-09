package com.btrack.modules.recovery.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.modules.recovery.dto.RecoveryCheckInRequest;
import com.btrack.modules.recovery.dto.RecoveryCheckInResponse;
import com.btrack.modules.recovery.dto.RecoveryScoreResponse;
import com.btrack.modules.recovery.entity.RecoveryCheckIn;
import com.btrack.modules.recovery.entity.RecoveryScore;
import com.btrack.modules.recovery.entity.RecoveryScore.RecoveryLevel;
import com.btrack.modules.recovery.repository.RecoveryCheckInRepository;
import com.btrack.modules.recovery.repository.RecoveryScoreRepository;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.service.SubscriptionService;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import com.btrack.modules.subscription.entity.Subscription.FeatureKey;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecoveryScoreServiceTest {

    @Mock RecoveryCalculationService calculationService;
    @Mock RecoveryScoreRepository    scoreRepository;
    @Mock RecoveryCheckInRepository  checkInRepository;
    @Mock SubscriptionService        subscriptionService;
    @Mock UserRepository             userRepository;

    @InjectMocks RecoveryScoreService service;

    private final UUID userId = UUID.randomUUID();

    private Subscription premiumSub() {
        Subscription sub = new Subscription();
        sub.setPlan(Subscription.SubscriptionPlan.PREMIUM_MONTHLY);
        sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        sub.setExpiresAt(java.time.Instant.now().plusSeconds(86400));
        return sub;
    }

    private Subscription freeSub() {
        Subscription sub = new Subscription();
        sub.setPlan(Subscription.SubscriptionPlan.FREE);
        sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        return sub;
    }

    private RecoveryScore scoreForDate(LocalDate date) {
        RecoveryScore rs = new RecoveryScore();
        rs.setScoreDate(date);
        rs.setFinalScore(75);
        rs.setRecoveryLevel(RecoveryLevel.READY_FOR_NORMAL_TRAINING);
        rs.setConfidence(BigDecimal.valueOf(0.80));
        rs.setComponents(Map.of(
                "sleep",              Map.of("score", 80, "status", "GOOD",    "explanation", "ok", "confidence", 0.9),
                "trainingLoad",       Map.of("score", 70, "status", "GOOD",    "explanation", "ok", "confidence", 0.85),
                "heartRecovery",      Map.of("score", 70, "status", "UNKNOWN", "explanation", "no", "confidence", 0.3),
                "hydration",          Map.of("score", 75, "status", "GOOD",    "explanation", "ok", "confidence", 0.8),
                "subjectiveWellness", Map.of("score", 80, "status", "GOOD",    "explanation", "ok", "confidence", 1.0)
        ));
        rs.setMissingData(List.of());
        rs.setRecommendations(List.of());
        return rs;
    }

    private User testUser() {
        User u = new User();
        u.setId(userId);
        return u;
    }

    // ── getOrCalculateToday ───────────────────────────────────────────────────

    @Test
    @DisplayName("getOrCalculateToday: returns cached score if it exists for today")
    void getToday_returnsCached() {
        RecoveryScore cached = scoreForDate(LocalDate.now());
        when(scoreRepository.findByUserIdAndScoreDate(eq(userId), eq(LocalDate.now())))
                .thenReturn(Optional.of(cached));

        RecoveryScoreResponse result = service.getOrCalculateToday(userId);

        assertThat(result.recoveryScore()).isEqualTo(75);
        verify(calculationService, never()).calculateAndPersist(any(), any());
    }

    @Test
    @DisplayName("getOrCalculateToday: calculates if no score exists today")
    void getToday_calculatesWhenMissing() {
        RecoveryScore calculated = scoreForDate(LocalDate.now());
        when(scoreRepository.findByUserIdAndScoreDate(eq(userId), eq(LocalDate.now())))
                .thenReturn(Optional.empty());
        when(calculationService.calculateAndPersist(eq(userId), eq(LocalDate.now())))
                .thenReturn(calculated);

        RecoveryScoreResponse result = service.getOrCalculateToday(userId);

        assertThat(result.recoveryScore()).isEqualTo(75);
        verify(calculationService).calculateAndPersist(userId, LocalDate.now());
    }

    // ── getByDate: premium gating ─────────────────────────────────────────────

    @Test
    @DisplayName("getByDate: free user accessing score within 7 days → allowed")
    void getByDate_freeUser_withinRange() {
        LocalDate recentDate = LocalDate.now().minusDays(3);
        when(subscriptionService.getSubscription(userId)).thenReturn(freeSub());
        when(scoreRepository.findByUserIdAndScoreDate(userId, recentDate))
                .thenReturn(Optional.of(scoreForDate(recentDate)));

        RecoveryScoreResponse result = service.getByDate(userId, recentDate);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getByDate: free user accessing score older than 7 days → featureLocked")
    void getByDate_freeUser_tooOld_locked() {
        LocalDate oldDate = LocalDate.now().minusDays(30);
        when(subscriptionService.getSubscription(userId)).thenReturn(freeSub());
        doThrow(BTrackException.featureLocked("RECOVERY_ADVANCED"))
                .when(subscriptionService).requireFeature(eq(userId), any(FeatureKey.class));

        assertThatThrownBy(() -> service.getByDate(userId, oldDate))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.PAYMENT_REQUIRED);
    }

    @Test
    @DisplayName("getByDate: premium user can access old scores")
    void getByDate_premiumUser_noRestriction() {
        LocalDate oldDate = LocalDate.now().minusDays(60);
        when(subscriptionService.getSubscription(userId)).thenReturn(premiumSub());
        when(scoreRepository.findByUserIdAndScoreDate(userId, oldDate))
                .thenReturn(Optional.of(scoreForDate(oldDate)));

        RecoveryScoreResponse result = service.getByDate(userId, oldDate);

        assertThat(result).isNotNull();
        verify(subscriptionService, never()).requireFeature(any(UUID.class), any(FeatureKey.class));
    }

    // ── createCheckIn ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createCheckIn: duplicate for same date → badRequest")
    void createCheckIn_duplicate_throws() {
        LocalDate today = LocalDate.now();
        RecoveryCheckInRequest req = new RecoveryCheckInRequest(today, 3, 2, 2, 4, 3, null);
        when(checkInRepository.existsByUserIdAndCheckInDate(userId, today)).thenReturn(true);

        assertThatThrownBy(() -> service.createCheckIn(userId, req))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("createCheckIn: success → saves and returns response")
    void createCheckIn_success() {
        LocalDate today = LocalDate.now();
        RecoveryCheckInRequest req = new RecoveryCheckInRequest(today, 4, 2, 2, 4, 4, "Feeling good");
        User user = testUser();

        when(checkInRepository.existsByUserIdAndCheckInDate(userId, today)).thenReturn(false);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        RecoveryCheckIn saved = new RecoveryCheckIn();
        saved.setUser(user);
        saved.setCheckInDate(today);
        saved.setEnergyLevel(4);
        saved.setSorenessLevel(2);
        saved.setStressLevel(2);
        saved.setMoodLevel(4);
        saved.setMotivationLevel(4);
        saved.setNotes("Feeling good");
        when(checkInRepository.save(any(RecoveryCheckIn.class))).thenReturn(saved);
        when(calculationService.calculateAndPersist(any(), any()))
                .thenReturn(scoreForDate(today));

        RecoveryCheckInResponse result = service.createCheckIn(userId, req);

        assertThat(result.energyLevel()).isEqualTo(4);
        assertThat(result.notes()).isEqualTo("Feeling good");
        verify(calculationService).calculateAndPersist(userId, today);
    }

    // ── updateCheckIn: ownership ───────────────────────────────────────────────

    @Test
    @DisplayName("updateCheckIn: different user → forbidden")
    void updateCheckIn_wrongUser_forbidden() {
        UUID otherUser = UUID.randomUUID();
        UUID checkInId = UUID.randomUUID();
        User owner = new User();
        owner.setId(otherUser);

        RecoveryCheckIn ci = new RecoveryCheckIn();
        ci.setUser(owner);
        ci.setCheckInDate(LocalDate.now().minusDays(1));
        when(checkInRepository.findById(checkInId)).thenReturn(Optional.of(ci));

        RecoveryCheckInRequest req = new RecoveryCheckInRequest(null, 3, 2, 2, 3, 3, null);

        assertThatThrownBy(() -> service.updateCheckIn(userId, checkInId, req))
                .isInstanceOf(BTrackException.class)
                .extracting(e -> ((BTrackException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("updateCheckIn: owner can update their own check-in")
    void updateCheckIn_owner_succeeds() {
        UUID checkInId = UUID.randomUUID();
        User owner = testUser();

        RecoveryCheckIn ci = new RecoveryCheckIn();
        ci.setUser(owner);
        ci.setCheckInDate(LocalDate.now().minusDays(1));
        ci.setEnergyLevel(2);
        ci.setSorenessLevel(4);
        ci.setStressLevel(4);
        ci.setMoodLevel(2);
        ci.setMotivationLevel(2);
        when(checkInRepository.findById(checkInId)).thenReturn(Optional.of(ci));
        when(checkInRepository.save(ci)).thenReturn(ci);

        RecoveryCheckInRequest req = new RecoveryCheckInRequest(null, 5, 1, 1, 5, 5, null);
        service.updateCheckIn(userId, checkInId, req);

        assertThat(ci.getEnergyLevel()).isEqualTo(5);
        assertThat(ci.getSorenessLevel()).isEqualTo(1);
    }

    // ── getTodayCheckIn ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getTodayCheckIn: returns null if no check-in exists")
    void getTodayCheckIn_notFound_returnsNull() {
        when(checkInRepository.findByUserIdAndCheckInDate(userId, LocalDate.now()))
                .thenReturn(Optional.empty());

        RecoveryCheckInResponse result = service.getTodayCheckIn(userId);

        assertThat(result).isNull();
    }
}
