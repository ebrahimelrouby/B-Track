package com.btrack.modules.recovery.service;

import com.btrack.modules.recovery.calculator.ComponentScore;
import com.btrack.modules.recovery.entity.RecoveryRecommendation;
import com.btrack.modules.recovery.entity.RecoveryScore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecoveryRecommendationService {

    private static final String DISCLAIMER_NOTE =
            "This is a fitness estimate only — not medical advice.";

    public List<RecoveryRecommendation> generate(
            RecoveryScore score,
            ComponentScore sleep,
            ComponentScore training,
            ComponentScore hydration,
            ComponentScore subjective) {

        List<RecoveryRecommendation> list = new ArrayList<>();
        int priority = 1;
        int finalScore = score.getFinalScore();

        // ── Training recommendation (always first) ────────────────────────────
        String trainingTitle;
        String trainingDesc;
        if (finalScore >= 85) {
            trainingTitle = "Ready for heavy training";
            trainingDesc  = "Your recovery looks excellent. Follow your planned workout at full intensity. "
                    + "This is a great day to push your strength limits or try a PR.";
        } else if (finalScore >= 70) {
            trainingTitle = "Normal training is suitable";
            trainingDesc  = "Recovery is solid. Proceed with your planned workout — "
                    + "avoid adding extra volume or unnecessary intensity today.";
        } else if (finalScore >= 55) {
            trainingTitle = "Moderate training recommended";
            trainingDesc  = "Consider reducing intensity by 10–15%. "
                    + "Focus on technique, accessory work, or moderate cardio rather than maximal effort.";
        } else if (finalScore >= 40) {
            trainingTitle = "Light activity only";
            trainingDesc  = "Your body needs recovery today. "
                    + "A light walk, yoga, or mobility work would be more beneficial than a hard session.";
        } else {
            trainingTitle = "Rest recommended today";
            trainingDesc  = "Recovery metrics are low across multiple areas. "
                    + "Full rest will produce better long-term gains than training through fatigue.";
        }
        list.add(build(score, RecoveryRecommendation.Type.TRAINING.name(), trainingTitle, trainingDesc, priority++));

        // ── Sleep recommendation ───────────────────────────────────────────────
        if (sleep.score() < 70) {
            list.add(build(score, RecoveryRecommendation.Type.SLEEP.name(),
                    "Prioritise sleep tonight",
                    "Last night's sleep was below your target. "
                            + "Aim to go to bed 30–45 minutes earlier tonight and limit screen time before sleep.",
                    priority++));
        }

        // ── Hydration recommendation ───────────────────────────────────────────
        if (hydration.score() < 70) {
            list.add(build(score, RecoveryRecommendation.Type.HYDRATION.name(),
                    "Improve hydration before training",
                    "Your hydration was low yesterday. "
                            + "Drink at least 500ml of water in the 60 minutes before your workout today.",
                    priority++));
        }

        // ── Check-in prompt ────────────────────────────────────────────────────
        if (subjective.confidence() < 0.5) {
            list.add(build(score, RecoveryRecommendation.Type.GENERAL.name(),
                    "Complete your daily check-in",
                    "Your subjective wellness data is missing. "
                            + "A 30-second check-in improves your recovery score accuracy significantly.",
                    priority));
        }

        return list;
    }

    private RecoveryRecommendation build(RecoveryScore score, String type, String title, String desc, int p) {
        return RecoveryRecommendation.builder()
                .recoveryScore(score)
                .type(type)
                .title(title)
                .description(desc)
                .priority(p)
                .build();
    }
}
