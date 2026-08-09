package com.btrack.modules.recovery.calculator;

import com.btrack.modules.sleep.entity.SleepLog;
import com.btrack.modules.sleep.repository.SleepLogRepository;
import com.btrack.modules.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SleepRecoveryCalculator {

    private final SleepLogRepository sleepLogRepository;
    private final UserProfileRepository userProfileRepository;

    public ComponentScore calculate(UUID userId, LocalDate scoreDate) {
        // We look at sleep for the night before the score date
        LocalDate sleepDate = scoreDate.minusDays(1);
        Optional<SleepLog> logOpt = sleepLogRepository.findByUserIdAndDate(userId, sleepDate);

        if (logOpt.isEmpty()) {
            return ComponentScore.unknown(
                    "No sleep data for last night. Log your sleep or sync Apple Health for accurate sleep scoring.");
        }

        SleepLog log = logOpt.get();
        double targetHours = userProfileRepository.findByUserId(userId)
                .map(p -> p.getTargetSleepHours() != null ? p.getTargetSleepHours() : 8.0)
                .orElse(8.0);

        double actualHours = log.getDurationMinutes() / 60.0;
        double ratio = actualHours / targetHours;

        // Duration score (60% weight) with a flat-top between 90–120% of target
        double durationScore;
        if (ratio >= 0.9 && ratio <= 1.2) {
            durationScore = 100;
        } else if (ratio > 1.2) {
            // Oversleeping slightly penalised — must come before the ratio >= 0.75 branch
            durationScore = 100 - (ratio - 1.2) * 60;
        } else if (ratio >= 0.75) {
            durationScore = 60 + ((ratio - 0.75) / 0.15) * 40;
        } else {
            durationScore = (ratio / 0.75) * 60;
        }
        durationScore = Math.max(0, Math.min(100, durationScore));

        // Quality / efficiency score (40% weight)
        double qualityScore = (log.getQualityScore() != null) ? log.getQualityScore() : 70.0;

        int score = (int) Math.round(durationScore * 0.60 + qualityScore * 0.40);
        score = Math.max(0, Math.min(100, score));

        List<String> missing = new ArrayList<>();
        if (log.getQualityScore() == null) {
            missing.add("Sleep quality score unavailable — only duration was used.");
        }

        String explanation = buildExplanation(actualHours, targetHours, score);
        return new ComponentScore(score, ComponentScore.statusForScore(score), explanation,
                missing.isEmpty() ? 0.90 : 0.65, missing);
    }

    private String buildExplanation(double actual, double target, int score) {
        long h = (long) actual;
        long m = Math.round((actual - h) * 60);
        String timeStr = h + "h " + m + "m";
        if (score >= 85) return "You slept " + timeStr + " — excellent rest.";
        if (score >= 70) return "You slept " + timeStr + ", close to your " + (int) target + "h target.";
        double deficit = target - actual;
        return String.format("You slept %s, %.0f minutes below your %.0fh target.", timeStr, deficit * 60, target);
    }
}
