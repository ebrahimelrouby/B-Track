package com.btrack.modules.recovery.calculator;

import com.btrack.modules.recovery.entity.RecoveryCheckIn;
import com.btrack.modules.recovery.repository.RecoveryCheckInRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SubjectiveWellnessCalculator {

    private final RecoveryCheckInRepository checkInRepository;

    public ComponentScore calculate(UUID userId, LocalDate scoreDate) {
        Optional<RecoveryCheckIn> opt = checkInRepository.findByUserIdAndCheckInDate(userId, scoreDate);

        if (opt.isEmpty()) {
            return new ComponentScore(
                    65,
                    "UNKNOWN",
                    "No daily check-in for today. Complete your check-in for a more personalised recovery score.",
                    0.30,
                    List.of("Daily check-in not completed")
            );
        }

        RecoveryCheckIn ci = opt.get();

        // Soreness and stress are INVERSE scales (high = worse recovery)
        double rawScore = (
                ci.getEnergyLevel()
                + (6 - ci.getSorenessLevel())
                + (6 - ci.getStressLevel())
                + ci.getMoodLevel()
                + ci.getMotivationLevel()
        ) / 25.0 * 100.0;

        int score = (int) Math.round(Math.max(0, Math.min(100, rawScore)));
        String explanation = String.format(
                "Based on your check-in: energy %d/5, soreness %d/5, stress %d/5, mood %d/5.",
                ci.getEnergyLevel(), ci.getSorenessLevel(), ci.getStressLevel(), ci.getMoodLevel());

        return new ComponentScore(score, ComponentScore.statusForScore(score), explanation, 1.00, List.of());
    }
}
