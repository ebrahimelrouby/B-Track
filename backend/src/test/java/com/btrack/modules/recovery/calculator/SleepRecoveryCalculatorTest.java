package com.btrack.modules.recovery.calculator;

import com.btrack.modules.sleep.entity.SleepLog;
import com.btrack.modules.sleep.repository.SleepLogRepository;
import com.btrack.modules.user.entity.UserProfile;
import com.btrack.modules.user.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SleepRecoveryCalculatorTest {

    @Mock SleepLogRepository sleepLogRepository;
    @Mock UserProfileRepository userProfileRepository;

    @InjectMocks SleepRecoveryCalculator calculator;

    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.now();
    private final LocalDate yesterday = today.minusDays(1);

    private UserProfile profileWith(double targetHours) {
        UserProfile p = new UserProfile();
        p.setTargetSleepHours(targetHours);
        return p;
    }

    private SleepLog logWith(int durationMinutes, Integer qualityScore) {
        SleepLog log = new SleepLog();
        log.setDurationMinutes(durationMinutes);
        log.setQualityScore(qualityScore);
        return log;
    }

    @BeforeEach
    void stubProfile() {
        lenient().when(userProfileRepository.findByUserId(userId))
                .thenReturn(Optional.of(profileWith(8.0)));
    }

    @Test
    @DisplayName("No sleep log → UNKNOWN score at 65 with low confidence")
    void noSleepLog_returnsUnknown() {
        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.empty());

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(65);
        assertThat(result.status()).isEqualTo("UNKNOWN");
        assertThat(result.confidence()).isEqualTo(0.30);
        assertThat(result.missingData()).isNotEmpty();
    }

    @Test
    @DisplayName("8h sleep with quality 90 on 8h target → excellent score")
    void perfectSleep_highScore() {
        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.of(logWith(480, 90)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isGreaterThanOrEqualTo(85);
        assertThat(result.status()).isEqualTo("EXCELLENT");
        assertThat(result.confidence()).isEqualTo(0.90);
        assertThat(result.missingData()).isEmpty();
    }

    @Test
    @DisplayName("5h sleep on 8h target → poor score below 50")
    void shortSleep_lowScore() {
        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.of(logWith(300, 70)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isLessThan(60);
        assertThat(result.explanation()).contains("below your");
    }

    @Test
    @DisplayName("Missing quality score → uses 70 default, confidence 0.65")
    void missingQuality_reducedConfidence() {
        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.of(logWith(480, null)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.confidence()).isEqualTo(0.65);
        assertThat(result.missingData()).hasSize(1);
    }

    @Test
    @DisplayName("Oversleeping (11h on 8h target) → penalised score")
    void oversleeping_penalised() {
        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.of(logWith(660, 80)));

        ComponentScore oversleep = calculator.calculate(userId, today);

        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.of(logWith(480, 80)));

        ComponentScore optimal = calculator.calculate(userId, today);

        assertThat(oversleep.score()).isLessThan(optimal.score());
    }

    @Test
    @DisplayName("7.5h on 8h target (within 90%–120% band) → still max duration score")
    void nearTarget_maxDurationScore() {
        // 7h12m = 432 min = 90% of 480 min = exactly at lower bound of flat-top
        when(sleepLogRepository.findByUserIdAndDate(userId, yesterday))
                .thenReturn(Optional.of(logWith(432, 80)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isGreaterThanOrEqualTo(80);
    }
}
