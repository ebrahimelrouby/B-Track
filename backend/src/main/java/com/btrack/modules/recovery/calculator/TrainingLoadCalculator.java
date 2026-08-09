package com.btrack.modules.recovery.calculator;

import com.btrack.modules.session.entity.WorkoutSession;
import com.btrack.modules.session.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TrainingLoadCalculator {

    private final WorkoutSessionRepository sessionRepository;

    public ComponentScore calculate(UUID userId, LocalDate scoreDate) {
        Instant oneWeekAgo = scoreDate.minusDays(7).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<WorkoutSession> weekSessions = sessionRepository.findSessionsSince(userId, oneWeekAgo);

        if (weekSessions.isEmpty()) {
            return new ComponentScore(90, "WELL_RESTED",
                    "No workouts in the last 7 days. Your muscles are well rested, but avoid detraining.",
                    0.80, List.of());
        }

        // Find most recent completed session
        Instant lastCompleted = weekSessions.stream()
                .filter(s -> s.getCompletedAt() != null)
                .max(Comparator.comparing(WorkoutSession::getCompletedAt))
                .map(WorkoutSession::getCompletedAt)
                .orElse(null);

        int daysSinceLast = lastCompleted == null ? 7
                : (int) ChronoUnit.DAYS.between(
                        lastCompleted.atZone(ZoneOffset.UTC).toLocalDate(), scoreDate);

        int baseScore = switch (daysSinceLast) {
            case 0 -> 35;  // Still in progress or trained today
            case 1 -> 55;  // Trained yesterday — primary recovery window
            case 2 -> 75;  // 48 h rest — significant recovery
            case 3 -> 88;  // 72 h rest — full recovery for most muscle groups
            default -> 95; // 4+ days — well rested
        };

        // High weekly volume accumulation penalty
        double weeklyVolumeKg = weekSessions.stream()
                .filter(s -> s.getTotalVolumeKg() != null)
                .mapToDouble(v -> v.getTotalVolumeKg().doubleValue())
                .sum();

        int volumePenalty = weeklyVolumeKg > 20_000 ? 10 : weeklyVolumeKg > 12_000 ? 5 : 0;
        int score = Math.max(0, Math.min(100, baseScore - volumePenalty));

        String explanation = buildExplanation(daysSinceLast, weekSessions.size(), weeklyVolumeKg);
        return new ComponentScore(score, ComponentScore.statusForScore(score), explanation, 0.85, List.of());
    }

    private String buildExplanation(int daysSinceLast, int weekCount, double weeklyKg) {
        String weekly = weekCount + " workout" + (weekCount != 1 ? "s" : "");
        if (daysSinceLast == 0) return "You trained today — recovery is still in progress.";
        if (daysSinceLast == 1) return String.format(
                "You trained yesterday (%s this week, %.0f kg total volume). Today is a key recovery day.", weekly, weeklyKg);
        return String.format("%d days since your last session (%s this week). Training load is manageable.",
                daysSinceLast, weekly);
    }
}
