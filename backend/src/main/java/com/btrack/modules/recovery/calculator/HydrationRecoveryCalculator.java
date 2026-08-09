package com.btrack.modules.recovery.calculator;

import com.btrack.modules.user.repository.UserProfileRepository;
import com.btrack.modules.water.repository.WaterLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class HydrationRecoveryCalculator {

    private final WaterLogRepository waterLogRepository;
    private final UserProfileRepository userProfileRepository;

    public ComponentScore calculate(UUID userId, LocalDate scoreDate) {
        LocalDate yesterday = scoreDate.minusDays(1);
        var start = yesterday.atStartOfDay(ZoneOffset.UTC).toInstant();
        var end   = scoreDate.atStartOfDay(ZoneOffset.UTC).toInstant();

        long totalMl = waterLogRepository.sumAmountMlBetween(userId, start, end).orElse(0L);

        if (totalMl == 0) {
            return ComponentScore.unknown(
                    "No hydration data logged for yesterday. Track water intake for accurate hydration scoring.");
        }

        int targetMl = userProfileRepository.findByUserId(userId)
                .map(p -> p.getTargetWaterMl() != null ? p.getTargetWaterMl() : 2500)
                .orElse(2500);

        double ratio = (double) totalMl / targetMl;

        // Linear below target; cap at 100 above target
        int score;
        if (ratio >= 1.0) {
            score = 100;
        } else if (ratio >= 0.6) {
            // 60% intake → 50 score; 100% → 100 score (linear)
            score = (int) Math.round(50 + (ratio - 0.6) / 0.4 * 50);
        } else {
            // Below 60% — heavy penalty
            score = (int) Math.round(ratio / 0.6 * 50);
        }
        score = Math.max(0, Math.min(100, score));

        String pct = String.format("%.0f%%", ratio * 100);
        String explanation = ratio >= 1.0
                ? "You met your " + targetMl + "ml hydration goal yesterday."
                : String.format("You reached %s of your %dml hydration goal yesterday.", pct, targetMl);

        return new ComponentScore(score, ComponentScore.statusForScore(score), explanation, 0.80, List.of());
    }
}
