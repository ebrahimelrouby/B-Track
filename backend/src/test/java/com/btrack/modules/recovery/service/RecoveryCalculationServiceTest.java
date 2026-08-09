package com.btrack.modules.recovery.service;

import com.btrack.modules.recovery.calculator.*;
import com.btrack.modules.recovery.entity.RecoveryScore;
import com.btrack.modules.recovery.entity.RecoveryScore.RecoveryLevel;
import com.btrack.modules.recovery.repository.RecoveryScoreRepository;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class RecoveryCalculationServiceTest {

    @Mock SleepRecoveryCalculator      sleepCalc;
    @Mock TrainingLoadCalculator       trainingCalc;
    @Mock HeartRecoveryCalculator      heartCalc;
    @Mock HydrationRecoveryCalculator  hydrationCalc;
    @Mock SubjectiveWellnessCalculator subjectiveCalc;
    @Mock RecoveryRecommendationService recommendationService;
    @Mock RecoveryScoreRepository      scoreRepository;
    @Mock UserRepository               userRepository;

    @InjectMocks RecoveryCalculationService calculationService;

    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.now();
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        lenient().when(scoreRepository.findByUserIdAndScoreDate(eq(userId), any())).thenReturn(Optional.empty());
        when(scoreRepository.save(any(RecoveryScore.class))).thenAnswer(inv -> inv.getArgument(0));
        when(recommendationService.generate(any(), any(), any(), any(), any())).thenReturn(List.of());
    }

    private ComponentScore component(int score) {
        return new ComponentScore(score, "GOOD", "ok", 0.90, List.of());
    }

    private ComponentScore unknownComponent() {
        return new ComponentScore(65, "UNKNOWN", "no data", 0.30, List.of("missing"));
    }

    @Test
    @DisplayName("Weighted formula: all components 100 → final score 100")
    void allPerfect_scoreIs100() {
        when(sleepCalc.calculate(userId, today)).thenReturn(component(100));
        when(trainingCalc.calculate(userId, today)).thenReturn(component(100));
        when(heartCalc.calculate(userId, today)).thenReturn(component(100));
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(100));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(component(100));

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);

        assertThat(result.getFinalScore()).isEqualTo(100);
        assertThat(result.getRecoveryLevel()).isEqualTo(RecoveryLevel.READY_FOR_HEAVY_TRAINING);
    }

    @Test
    @DisplayName("Weighted formula: all components 0 → final score 0")
    void allZero_scoreIsZero() {
        ComponentScore zero = new ComponentScore(0, "POOR", "bad", 0.80, List.of());
        when(sleepCalc.calculate(userId, today)).thenReturn(zero);
        when(trainingCalc.calculate(userId, today)).thenReturn(zero);
        when(heartCalc.calculate(userId, today)).thenReturn(zero);
        when(hydrationCalc.calculate(userId, today)).thenReturn(zero);
        when(subjectiveCalc.calculate(userId, today)).thenReturn(zero);

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);

        assertThat(result.getFinalScore()).isEqualTo(0);
        assertThat(result.getRecoveryLevel()).isEqualTo(RecoveryLevel.REST_RECOMMENDED);
    }

    @Test
    @DisplayName("Weighted formula: sleep=80, training=60, heart=70, hydration=90, wellness=100 → expected score")
    void weightedFormula_correctResult() {
        // 80*0.35 + 60*0.25 + 70*0.20 + 90*0.10 + 100*0.10
        // = 28 + 15 + 14 + 9 + 10 = 76
        when(sleepCalc.calculate(userId, today)).thenReturn(component(80));
        when(trainingCalc.calculate(userId, today)).thenReturn(component(60));
        when(heartCalc.calculate(userId, today)).thenReturn(component(70));
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(90));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(component(100));

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);

        assertThat(result.getFinalScore()).isEqualTo(76);
        assertThat(result.getRecoveryLevel()).isEqualTo(RecoveryLevel.READY_FOR_NORMAL_TRAINING);
    }

    @Test
    @DisplayName("Missing data → collected from all unknown components")
    void missingData_aggregated() {
        when(sleepCalc.calculate(userId, today)).thenReturn(unknownComponent());
        when(trainingCalc.calculate(userId, today)).thenReturn(component(80));
        when(heartCalc.calculate(userId, today)).thenReturn(unknownComponent());
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(70));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(unknownComponent());

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);

        // All three unknowns have "missing" in their missingData list — deduplicated to one entry
        assertThat(result.getMissingData()).isNotEmpty();
    }

    @Test
    @DisplayName("All unknown data → confidence significantly below 1.0")
    void allUnknown_lowConfidence() {
        when(sleepCalc.calculate(userId, today)).thenReturn(unknownComponent());
        when(trainingCalc.calculate(userId, today)).thenReturn(unknownComponent());
        when(heartCalc.calculate(userId, today)).thenReturn(unknownComponent());
        when(hydrationCalc.calculate(userId, today)).thenReturn(unknownComponent());
        when(subjectiveCalc.calculate(userId, today)).thenReturn(unknownComponent());

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);

        assertThat(result.getConfidence().doubleValue()).isLessThan(0.50);
    }

    @Test
    @DisplayName("Upsert: existing score for same date is deleted before inserting new one")
    void upsert_deletesOldRecord() {
        RecoveryScore existing = new RecoveryScore();
        when(scoreRepository.findByUserIdAndScoreDate(eq(userId), eq(today)))
                .thenReturn(Optional.of(existing));

        when(sleepCalc.calculate(userId, today)).thenReturn(component(75));
        when(trainingCalc.calculate(userId, today)).thenReturn(component(75));
        when(heartCalc.calculate(userId, today)).thenReturn(component(75));
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(75));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(component(75));

        calculationService.calculateAndPersist(userId, today);

        verify(scoreRepository).delete(existing);
        verify(scoreRepository).flush();
    }

    @Test
    @DisplayName("Recovery level boundaries: 85+ = HEAVY, 70-84 = NORMAL, 55-69 = MODERATE")
    void levelBoundaries() {
        // Score 85 → HEAVY
        when(sleepCalc.calculate(userId, today)).thenReturn(component(85));
        when(trainingCalc.calculate(userId, today)).thenReturn(component(85));
        when(heartCalc.calculate(userId, today)).thenReturn(component(85));
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(85));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(component(85));

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);
        assertThat(result.getRecoveryLevel()).isEqualTo(RecoveryLevel.READY_FOR_HEAVY_TRAINING);

        // Score around 70 → NORMAL (sleep=70, all else 70 = 70)
        when(sleepCalc.calculate(userId, today)).thenReturn(component(70));
        when(trainingCalc.calculate(userId, today)).thenReturn(component(70));
        when(heartCalc.calculate(userId, today)).thenReturn(component(70));
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(70));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(component(70));

        RecoveryScore result2 = calculationService.calculateAndPersist(userId, today);
        assertThat(result2.getRecoveryLevel()).isEqualTo(RecoveryLevel.READY_FOR_NORMAL_TRAINING);
    }

    @Test
    @DisplayName("Components map is persisted with all 5 keys")
    void components_allFiveKeysPresent() {
        when(sleepCalc.calculate(userId, today)).thenReturn(component(75));
        when(trainingCalc.calculate(userId, today)).thenReturn(component(75));
        when(heartCalc.calculate(userId, today)).thenReturn(component(75));
        when(hydrationCalc.calculate(userId, today)).thenReturn(component(75));
        when(subjectiveCalc.calculate(userId, today)).thenReturn(component(75));

        RecoveryScore result = calculationService.calculateAndPersist(userId, today);

        assertThat(result.getComponents()).containsKeys(
                "sleep", "trainingLoad", "heartRecovery", "hydration", "subjectiveWellness");
    }
}
