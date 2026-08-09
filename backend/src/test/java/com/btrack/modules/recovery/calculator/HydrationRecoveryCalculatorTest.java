package com.btrack.modules.recovery.calculator;

import com.btrack.modules.user.entity.UserProfile;
import com.btrack.modules.user.repository.UserProfileRepository;
import com.btrack.modules.water.repository.WaterLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HydrationRecoveryCalculatorTest {

    @Mock WaterLogRepository waterLogRepository;
    @Mock UserProfileRepository userProfileRepository;

    @InjectMocks HydrationRecoveryCalculator calculator;

    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void stubProfile() {
        UserProfile p = new UserProfile();
        p.setTargetWaterMl(2500);
        lenient().when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(p));
    }

    @Test
    @DisplayName("No water logged → UNKNOWN at 65, low confidence")
    void noWater_returnsUnknown() {
        when(waterLogRepository.sumAmountMlBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Optional.of(0L));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(65);
        assertThat(result.status()).isEqualTo("UNKNOWN");
        assertThat(result.confidence()).isEqualTo(0.30);
    }

    @Test
    @DisplayName("Full goal met (2500 ml) → score 100")
    void fullGoal_perfectScore() {
        when(waterLogRepository.sumAmountMlBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Optional.of(2500L));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.confidence()).isEqualTo(0.80);
    }

    @Test
    @DisplayName("Over goal (3000 ml on 2500 target) → capped at 100")
    void overGoal_capped() {
        when(waterLogRepository.sumAmountMlBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Optional.of(3000L));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(100);
    }

    @Test
    @DisplayName("80% of goal (2000 ml) → score around 75")
    void eightyPercent_fairScore() {
        when(waterLogRepository.sumAmountMlBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Optional.of(2000L));

        ComponentScore result = calculator.calculate(userId, today);

        // ratio=0.8, formula: 50 + (0.8-0.6)/0.4*50 = 50 + 25 = 75
        assertThat(result.score()).isEqualTo(75);
    }

    @Test
    @DisplayName("50% of goal (1250 ml, below 60% threshold) → score below 42")
    void fiftyPercent_penalised() {
        when(waterLogRepository.sumAmountMlBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Optional.of(1250L));

        ComponentScore result = calculator.calculate(userId, today);

        // ratio=0.5, below 0.6 → 0.5/0.6*50 ≈ 41
        assertThat(result.score()).isLessThanOrEqualTo(42);
    }

    @Test
    @DisplayName("60% of goal (1500 ml) → exactly 50 score")
    void sixtyPercent_boundaryScore() {
        when(waterLogRepository.sumAmountMlBetween(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(Optional.of(1500L));

        ComponentScore result = calculator.calculate(userId, today);

        // ratio=0.6, exactly at boundary: score = 50
        assertThat(result.score()).isEqualTo(50);
    }
}
