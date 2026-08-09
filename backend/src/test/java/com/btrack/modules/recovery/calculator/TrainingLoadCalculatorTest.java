package com.btrack.modules.recovery.calculator;

import com.btrack.modules.session.entity.WorkoutSession;
import com.btrack.modules.session.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrainingLoadCalculatorTest {

    @Mock WorkoutSessionRepository sessionRepository;

    @InjectMocks TrainingLoadCalculator calculator;

    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.now();

    private WorkoutSession sessionCompletedDaysAgo(int daysAgo, double volumeKg) {
        WorkoutSession ws = new WorkoutSession();
        ws.setCompletedAt(today.minusDays(daysAgo).atStartOfDay(ZoneOffset.UTC).toInstant().plusSeconds(3600));
        ws.setTotalVolumeKg(BigDecimal.valueOf(volumeKg));
        return ws;
    }

    @Test
    @DisplayName("No sessions in last 7 days → score 90 (well rested)")
    void noSessions_wellRested() {
        when(sessionRepository.findSessionsSince(eq(userId), any(Instant.class)))
                .thenReturn(List.of());

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(90);
        assertThat(result.status()).isEqualTo("WELL_RESTED");
    }

    @Test
    @DisplayName("Trained yesterday → base score 55")
    void trainedYesterday_recoveryDay() {
        WorkoutSession ws = sessionCompletedDaysAgo(1, 5000);
        when(sessionRepository.findSessionsSince(eq(userId), any(Instant.class)))
                .thenReturn(List.of(ws));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isLessThanOrEqualTo(60);
        assertThat(result.explanation()).contains("yesterday");
    }

    @Test
    @DisplayName("Trained 2 days ago → score around 75")
    void trained2DaysAgo_goodRecovery() {
        WorkoutSession ws = sessionCompletedDaysAgo(2, 5000);
        when(sessionRepository.findSessionsSince(eq(userId), any(Instant.class)))
                .thenReturn(List.of(ws));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isBetween(70, 80);
    }

    @Test
    @DisplayName("Trained 3 days ago → score around 88")
    void trained3DaysAgo_nearFullRecovery() {
        WorkoutSession ws = sessionCompletedDaysAgo(3, 5000);
        when(sessionRepository.findSessionsSince(eq(userId), any(Instant.class)))
                .thenReturn(List.of(ws));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isGreaterThanOrEqualTo(83);
    }

    @Test
    @DisplayName("Very high weekly volume (>20 000 kg) → 10-point penalty")
    void highVolume_penalty() {
        // Trained yesterday + massive weekly volume
        WorkoutSession yesterday = sessionCompletedDaysAgo(1, 21_000);
        when(sessionRepository.findSessionsSince(eq(userId), any(Instant.class)))
                .thenReturn(List.of(yesterday));

        ComponentScore result = calculator.calculate(userId, today);

        // Base for 1-day-ago = 55, minus 10 = 45
        assertThat(result.score()).isEqualTo(45);
    }

    @Test
    @DisplayName("Moderate weekly volume (>12 000 kg) → 5-point penalty")
    void moderateVolume_smallPenalty() {
        WorkoutSession session = sessionCompletedDaysAgo(1, 13_000);
        when(sessionRepository.findSessionsSince(eq(userId), any(Instant.class)))
                .thenReturn(List.of(session));

        ComponentScore result = calculator.calculate(userId, today);

        // Base 55 - 5 = 50
        assertThat(result.score()).isEqualTo(50);
    }
}
