package com.btrack.modules.recovery.service;

import com.btrack.modules.recovery.calculator.ComponentScore;
import com.btrack.modules.recovery.entity.RecoveryRecommendation;
import com.btrack.modules.recovery.entity.RecoveryScore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RecoveryRecommendationServiceTest {

    private final RecoveryRecommendationService service = new RecoveryRecommendationService();

    private RecoveryScore scoreWith(int finalScore) {
        RecoveryScore s = new RecoveryScore();
        s.setFinalScore(finalScore);
        return s;
    }

    private ComponentScore goodComponent() {
        return new ComponentScore(80, "GOOD", "Good", 0.90, List.of());
    }

    private ComponentScore poorComponent() {
        return new ComponentScore(50, "POOR", "Poor", 0.80, List.of());
    }

    private ComponentScore noCheckIn() {
        return new ComponentScore(65, "UNKNOWN", "No check-in", 0.30, List.of("No check-in"));
    }

    @Test
    @DisplayName("Score ≥ 85 → first recommendation is 'Ready for heavy training'")
    void highScore_heavyTrainingRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(90), goodComponent(), goodComponent(), goodComponent(), goodComponent());

        assertThat(recs).isNotEmpty();
        assertThat(recs.get(0).getType()).isEqualTo("TRAINING");
        assertThat(recs.get(0).getTitle().toLowerCase()).contains("heavy");
    }

    @Test
    @DisplayName("Score 70–84 → training rec says 'normal'")
    void midScore_normalTrainingRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(75), goodComponent(), goodComponent(), goodComponent(), goodComponent());

        assertThat(recs.get(0).getType()).isEqualTo("TRAINING");
        assertThat(recs.get(0).getTitle().toLowerCase()).contains("normal");
    }

    @Test
    @DisplayName("Score < 40 → rest recommended")
    void lowScore_restRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(30), poorComponent(), poorComponent(), poorComponent(), noCheckIn());

        assertThat(recs.get(0).getTitle().toLowerCase()).contains("rest");
    }

    @Test
    @DisplayName("Poor sleep score → adds SLEEP recommendation")
    void poorSleep_addsSleepRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(70), poorComponent(), goodComponent(), goodComponent(), goodComponent());

        boolean hasSleepRec = recs.stream()
                .anyMatch(r -> r.getType().equals("SLEEP"));
        assertThat(hasSleepRec).isTrue();
    }

    @Test
    @DisplayName("Good sleep score → no SLEEP recommendation")
    void goodSleep_noSleepRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(80), goodComponent(), goodComponent(), goodComponent(), goodComponent());

        boolean hasSleepRec = recs.stream()
                .anyMatch(r -> r.getType().equals("SLEEP"));
        assertThat(hasSleepRec).isFalse();
    }

    @Test
    @DisplayName("Poor hydration → adds HYDRATION recommendation")
    void poorHydration_addsHydrationRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(70), goodComponent(), goodComponent(), poorComponent(), goodComponent());

        boolean hasHydrationRec = recs.stream()
                .anyMatch(r -> r.getType().equals("HYDRATION"));
        assertThat(hasHydrationRec).isTrue();
    }

    @Test
    @DisplayName("No check-in → adds GENERAL check-in prompt")
    void noCheckIn_addsGeneralRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(75), goodComponent(), goodComponent(), goodComponent(), noCheckIn());

        boolean hasGeneralRec = recs.stream()
                .anyMatch(r -> r.getType().equals("GENERAL"));
        assertThat(hasGeneralRec).isTrue();
    }

    @Test
    @DisplayName("Recommendations are ordered by priority")
    void recommendations_orderedByPriority() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(60), poorComponent(), goodComponent(), poorComponent(), noCheckIn());

        for (int i = 1; i < recs.size(); i++) {
            assertThat(recs.get(i).getPriority()).isGreaterThanOrEqualTo(recs.get(i - 1).getPriority());
        }
    }

    @Test
    @DisplayName("All good components → only training recommendation")
    void allGood_onlyTrainingRec() {
        List<RecoveryRecommendation> recs = service.generate(
                scoreWith(85), goodComponent(), goodComponent(), goodComponent(), goodComponent());

        assertThat(recs).hasSize(1);
        assertThat(recs.get(0).getType()).isEqualTo("TRAINING");
    }
}
