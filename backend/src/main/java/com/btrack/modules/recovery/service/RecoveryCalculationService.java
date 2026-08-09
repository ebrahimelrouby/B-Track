package com.btrack.modules.recovery.service;

import com.btrack.modules.recovery.calculator.*;
import com.btrack.modules.recovery.entity.RecoveryScore;
import com.btrack.modules.recovery.entity.RecoveryScore.RecoveryLevel;
import com.btrack.modules.recovery.entity.RecoveryRecommendation;
import com.btrack.modules.recovery.repository.RecoveryScoreRepository;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class RecoveryCalculationService {

    // Component weights (must sum to 1.0)
    private static final double W_SLEEP      = 0.35;
    private static final double W_TRAINING   = 0.25;
    private static final double W_HEART      = 0.20;
    private static final double W_HYDRATION  = 0.10;
    private static final double W_SUBJECTIVE = 0.10;

    private final SleepRecoveryCalculator      sleepCalculator;
    private final TrainingLoadCalculator       trainingCalculator;
    private final HeartRecoveryCalculator      heartCalculator;
    private final HydrationRecoveryCalculator  hydrationCalculator;
    private final SubjectiveWellnessCalculator subjectiveCalculator;
    private final RecoveryRecommendationService recommendationService;
    private final RecoveryScoreRepository      scoreRepository;
    private final UserRepository               userRepository;

    @Transactional
    public RecoveryScore calculateAndPersist(UUID userId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Run all calculators independently
        ComponentScore sleep      = sleepCalculator.calculate(userId, date);
        ComponentScore training   = trainingCalculator.calculate(userId, date);
        ComponentScore heart      = heartCalculator.calculate(userId, date);
        ComponentScore hydration  = hydrationCalculator.calculate(userId, date);
        ComponentScore subjective = subjectiveCalculator.calculate(userId, date);

        // Weighted final score
        double raw = sleep.score()      * W_SLEEP
                   + training.score()   * W_TRAINING
                   + heart.score()      * W_HEART
                   + hydration.score()  * W_HYDRATION
                   + subjective.score() * W_SUBJECTIVE;
        int finalScore = (int) Math.round(Math.max(0, Math.min(100, raw)));

        // Weighted confidence
        double rawConf = sleep.confidence()      * W_SLEEP
                       + training.confidence()   * W_TRAINING
                       + heart.confidence()      * W_HEART
                       + hydration.confidence()  * W_HYDRATION
                       + subjective.confidence() * W_SUBJECTIVE;
        BigDecimal confidence = BigDecimal.valueOf(Math.round(rawConf * 1000) / 1000.0);

        RecoveryLevel level = levelForScore(finalScore);

        // Collect all missing-data notes
        List<String> missing = Stream.of(sleep, training, heart, hydration, subjective)
                .flatMap(c -> c.missingData().stream())
                .distinct()
                .collect(Collectors.toList());

        // Pack component detail into a map for JSONB storage
        Map<String, Object> components = Map.of(
                "sleep",              componentMap(sleep),
                "trainingLoad",       componentMap(training),
                "heartRecovery",      componentMap(heart),
                "hydration",          componentMap(hydration),
                "subjectiveWellness", componentMap(subjective)
        );

        String explanation = buildExplanation(finalScore, level, sleep, training);

        // Upsert: delete existing record for this date, then insert fresh
        scoreRepository.findByUserIdAndScoreDate(userId, date)
                .ifPresent(old -> scoreRepository.delete(old));
        scoreRepository.flush();

        RecoveryScore score = RecoveryScore.builder()
                .user(user)
                .scoreDate(date)
                .finalScore(finalScore)
                .recoveryLevel(level)
                .confidence(confidence)
                .sleepScore(sleep.score())
                .trainingLoadScore(training.score())
                .heartRecoveryScore(heart.score())
                .hydrationScore(hydration.score())
                .subjectiveWellnessScore(subjective.score())
                .components(components)
                .explanation(explanation)
                .missingData(missing)
                .build();

        RecoveryScore saved = scoreRepository.save(score);

        // Generate and attach recommendations
        List<RecoveryRecommendation> recs =
                recommendationService.generate(saved, sleep, training, hydration, subjective);
        saved.getRecommendations().addAll(recs);

        return scoreRepository.save(saved);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private static RecoveryLevel levelForScore(int score) {
        if (score >= 85) return RecoveryLevel.READY_FOR_HEAVY_TRAINING;
        if (score >= 70) return RecoveryLevel.READY_FOR_NORMAL_TRAINING;
        if (score >= 55) return RecoveryLevel.MODERATE_TRAINING_RECOMMENDED;
        if (score >= 40) return RecoveryLevel.LIGHT_ACTIVITY_RECOMMENDED;
        return RecoveryLevel.REST_RECOMMENDED;
    }

    private static Map<String, Object> componentMap(ComponentScore cs) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("score",       cs.score());
        m.put("status",      cs.status());
        m.put("explanation", cs.explanation());
        m.put("confidence",  cs.confidence());
        return m;
    }

    private static String buildExplanation(int score, RecoveryLevel level, ComponentScore sleep, ComponentScore training) {
        return switch (level) {
            case READY_FOR_HEAVY_TRAINING   -> "All systems look great. Your sleep, training load, and hydration support maximal effort today.";
            case READY_FOR_NORMAL_TRAINING  -> "Recovery is solid. You're ready for a normal training session.";
            case MODERATE_TRAINING_RECOMMENDED -> "Some fatigue indicators are elevated. " + training.explanation();
            case LIGHT_ACTIVITY_RECOMMENDED  -> "Multiple recovery markers are below optimal. " + sleep.explanation();
            case REST_RECOMMENDED            -> "Your body needs rest today. Avoid heavy training to protect your long-term progress.";
        };
    }
}
