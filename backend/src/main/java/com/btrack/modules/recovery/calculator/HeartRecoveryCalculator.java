package com.btrack.modules.recovery.calculator;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Heart recovery calculator.
 *
 * Currently returns a neutral score when no heart rate data is available in the DB.
 * Once Apple HealthKit / Health Connect sync populates a heart_rate_logs table,
 * this calculator will use resting HR and HRV to produce a real score.
 *
 * Confidence is intentionally low (0.30) when data is missing so the overall
 * recovery score confidence reflects the gap.
 */
@Component
public class HeartRecoveryCalculator {

    public ComponentScore calculate(UUID userId, LocalDate scoreDate) {
        // Future: query heart_rate_logs for restingHR on scoreDate and compare to
        // user's 30-day baseline.  If deviation > 10% → penalise.

        return new ComponentScore(
                70,
                "UNKNOWN",
                "Heart rate data is unavailable. Connect Apple Health or Health Connect for accurate heart recovery scoring.",
                0.30,
                List.of("Resting heart rate data unavailable — connect a health platform to unlock this component.")
        );
    }
}
