package com.btrack.modules.recovery.calculator;

import com.btrack.modules.recovery.entity.RecoveryCheckIn;
import com.btrack.modules.recovery.repository.RecoveryCheckInRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubjectiveWellnessCalculatorTest {

    @Mock RecoveryCheckInRepository checkInRepository;

    @InjectMocks SubjectiveWellnessCalculator calculator;

    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.now();

    private RecoveryCheckIn checkIn(int energy, int soreness, int stress, int mood, int motivation) {
        RecoveryCheckIn ci = new RecoveryCheckIn();
        ci.setEnergyLevel(energy);
        ci.setSorenessLevel(soreness);
        ci.setStressLevel(stress);
        ci.setMoodLevel(mood);
        ci.setMotivationLevel(motivation);
        return ci;
    }

    @Test
    @DisplayName("No check-in → 65 score, UNKNOWN, low confidence")
    void noCheckIn_returnsUnknown() {
        when(checkInRepository.findByUserIdAndCheckInDate(userId, today))
                .thenReturn(Optional.empty());

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(65);
        assertThat(result.status()).isEqualTo("UNKNOWN");
        assertThat(result.confidence()).isEqualTo(0.30);
        assertThat(result.missingData()).isNotEmpty();
    }

    @Test
    @DisplayName("All max positive scores → 100")
    void allMaxPositive_perfectScore() {
        // energy=5, soreness=1 (best), stress=1 (best), mood=5, motivation=5
        // (5 + (6-1) + (6-1) + 5 + 5) / 25 * 100 = 25/25*100 = 100
        when(checkInRepository.findByUserIdAndCheckInDate(userId, today))
                .thenReturn(Optional.of(checkIn(5, 1, 1, 5, 5)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.confidence()).isEqualTo(1.00);
    }

    @Test
    @DisplayName("All worst scores → 0")
    void allWorstScores_zeroScore() {
        // energy=1, soreness=5 (worst), stress=5 (worst), mood=1, motivation=1
        // (1 + (6-5) + (6-5) + 1 + 1) / 25 * 100 = 5/25*100 = 20
        when(checkInRepository.findByUserIdAndCheckInDate(userId, today))
                .thenReturn(Optional.of(checkIn(1, 5, 5, 1, 1)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(20);
        assertThat(result.status()).isEqualTo("POOR");
    }

    @Test
    @DisplayName("Average scores (3/5 all) → 60")
    void averageScores_midScore() {
        // (3 + (6-3) + (6-3) + 3 + 3) / 25 * 100 = 15/25*100 = 60
        when(checkInRepository.findByUserIdAndCheckInDate(userId, today))
                .thenReturn(Optional.of(checkIn(3, 3, 3, 3, 3)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(60);
    }

    @Test
    @DisplayName("Good check-in → status FAIR or better")
    void goodCheckIn_fairOrBetter() {
        // energy=4, soreness=2, stress=2, mood=4, motivation=4
        // (4 + (6-2) + (6-2) + 4 + 4) / 25 * 100 = 20/25*100 = 80
        when(checkInRepository.findByUserIdAndCheckInDate(userId, today))
                .thenReturn(Optional.of(checkIn(4, 2, 2, 4, 4)));

        ComponentScore result = calculator.calculate(userId, today);

        assertThat(result.score()).isEqualTo(80);
        assertThat(result.status()).isEqualTo("GOOD");
    }
}
