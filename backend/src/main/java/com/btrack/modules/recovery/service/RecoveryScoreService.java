package com.btrack.modules.recovery.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.recovery.dto.*;
import com.btrack.modules.recovery.entity.RecoveryCheckIn;
import com.btrack.modules.recovery.entity.RecoveryScore;
import com.btrack.modules.recovery.repository.RecoveryCheckInRepository;
import com.btrack.modules.recovery.repository.RecoveryScoreRepository;
import com.btrack.modules.subscription.service.SubscriptionService;
import com.btrack.modules.subscription.entity.Subscription.FeatureKey;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecoveryScoreService {

    private static final int FREE_HISTORY_DAYS = 7;

    private final RecoveryCalculationService calculationService;
    private final RecoveryScoreRepository    scoreRepository;
    private final RecoveryCheckInRepository  checkInRepository;
    private final SubscriptionService        subscriptionService;
    private final UserRepository             userRepository;

    // ── Recovery Score ────────────────────────────────────────────────────────

    public RecoveryScoreResponse getOrCalculateToday(UUID userId) {
        LocalDate today = LocalDate.now();
        return scoreRepository.findByUserIdAndScoreDate(userId, today)
                .map(RecoveryScoreResponse::from)
                .orElseGet(() -> RecoveryScoreResponse.from(
                        calculationService.calculateAndPersist(userId, today)));
    }

    public RecoveryScoreResponse getByDate(UUID userId, LocalDate date) {
        // Free users can only access the last 7 days
        if (!subscriptionService.getSubscription(userId).isPremium()) {
            LocalDate cutoff = LocalDate.now().minusDays(FREE_HISTORY_DAYS - 1);
            if (date.isBefore(cutoff)) {
                subscriptionService.requireFeature(userId, FeatureKey.RECOVERY_ADVANCED);
            }
        }
        RecoveryScore score = scoreRepository.findByUserIdAndScoreDate(userId, date)
                .orElseThrow(() -> BTrackException.notFound(
                        "No recovery score for date: " + date, ErrorCode.RECOVERY_SCORE_NOT_FOUND));
        return RecoveryScoreResponse.from(score);
    }

    public PagedResponse<RecoveryScoreResponse> getHistory(UUID userId, int page, int size) {
        boolean premium = subscriptionService.getSubscription(userId).isPremium();
        int effectiveSize = premium ? size : Math.min(size, FREE_HISTORY_DAYS);

        Page<RecoveryScore> p = scoreRepository.findByUserIdOrderByScoreDateDesc(
                userId, PageRequest.of(page, effectiveSize));

        List<RecoveryScoreResponse> content = p.getContent().stream()
                .map(RecoveryScoreResponse::from)
                .toList();

        return PagedResponse.<RecoveryScoreResponse>builder()
                .content(content)
                .page(page)
                .size(effectiveSize)
                .totalElements(p.getTotalElements())
                .totalPages(p.getTotalPages())
                .last(p.isLast())
                .first(p.isFirst())
                .build();
    }

    @Transactional
    public RecoveryScoreResponse recalculate(UUID userId) {
        LocalDate today = LocalDate.now();
        return RecoveryScoreResponse.from(
                calculationService.calculateAndPersist(userId, today));
    }

    // ── Check-In ──────────────────────────────────────────────────────────────

    @Transactional
    public RecoveryCheckInResponse createCheckIn(UUID userId, RecoveryCheckInRequest req) {
        LocalDate date = req.resolvedDate();

        if (checkInRepository.existsByUserIdAndCheckInDate(userId, date)) {
            throw BTrackException.badRequest(
                    "A check-in for " + date + " already exists. Use PUT to update it.",
                    ErrorCode.CHECK_IN_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BTrackException.notFound("User not found", ErrorCode.USER_NOT_FOUND));

        RecoveryCheckIn ci = RecoveryCheckIn.builder()
                .user(user)
                .checkInDate(date)
                .energyLevel(req.energyLevel())
                .sorenessLevel(req.sorenessLevel())
                .stressLevel(req.stressLevel())
                .moodLevel(req.moodLevel())
                .motivationLevel(req.motivationLevel())
                .notes(req.notes())
                .build();

        RecoveryCheckIn saved = checkInRepository.save(ci);

        // Recalculate today's score to incorporate the new subjective data
        if (date.equals(LocalDate.now())) {
            calculationService.calculateAndPersist(userId, date);
        }

        return RecoveryCheckInResponse.from(saved);
    }

    @Transactional
    public RecoveryCheckInResponse updateCheckIn(UUID userId, UUID checkInId, RecoveryCheckInRequest req) {
        RecoveryCheckIn ci = checkInRepository.findById(checkInId)
                .orElseThrow(() -> BTrackException.notFound(
                        "Check-in not found", ErrorCode.RECOVERY_CHECK_IN_NOT_FOUND));

        if (!ci.getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }

        ci.setEnergyLevel(req.energyLevel());
        ci.setSorenessLevel(req.sorenessLevel());
        ci.setStressLevel(req.stressLevel());
        ci.setMoodLevel(req.moodLevel());
        ci.setMotivationLevel(req.motivationLevel());
        if (req.notes() != null) ci.setNotes(req.notes());

        RecoveryCheckIn saved = checkInRepository.save(ci);
        if (ci.getCheckInDate().equals(LocalDate.now())) {
            calculationService.calculateAndPersist(userId, ci.getCheckInDate());
        }
        return RecoveryCheckInResponse.from(saved);
    }

    public RecoveryCheckInResponse getTodayCheckIn(UUID userId) {
        return checkInRepository.findByUserIdAndCheckInDate(userId, LocalDate.now())
                .map(RecoveryCheckInResponse::from)
                .orElse(null);
    }

    // ── Recommendations ───────────────────────────────────────────────────────

    public List<RecoveryRecommendationDto> getTodayRecommendations(UUID userId) {
        return scoreRepository.findByUserIdAndScoreDate(userId, LocalDate.now())
                .map(score -> score.getRecommendations().stream()
                        .map(RecoveryRecommendationDto::from)
                        .toList())
                .orElseGet(() -> {
                    RecoveryScore calculated = calculationService.calculateAndPersist(userId, LocalDate.now());
                    return calculated.getRecommendations().stream()
                            .map(RecoveryRecommendationDto::from)
                            .toList();
                });
    }
}
