package com.btrack.modules.steps.service;

import com.btrack.modules.steps.dto.DailyStepsResponse;
import com.btrack.modules.steps.dto.StepsLogRequest;
import com.btrack.modules.steps.entity.StepLog;
import com.btrack.modules.steps.repository.StepLogRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StepsService {

    private static final int DEFAULT_TARGET = 10_000;

    private final StepLogRepository stepLogRepository;
    private final UserRepository userRepository;

    public DailyStepsResponse getToday(UUID userId) {
        return toResponse(stepLogRepository.findByUserIdAndDate(userId, LocalDate.now())
                .orElse(null));
    }

    public List<DailyStepsResponse> getHistory(UUID userId, int days) {
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        return stepLogRepository.findByUserIdSince(userId, from)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public DailyStepsResponse logSteps(UUID userId, StepsLogRequest req) {
        StepLog log = stepLogRepository.findByUserIdAndDate(userId, req.date())
                .orElse(StepLog.builder()
                        .user(userRepository.getReferenceById(userId))
                        .date(req.date())
                        .build());

        log.setStepCount(req.steps());
        log.setDistanceM(BigDecimal.valueOf(req.steps() * 0.75)); // ~0.75 m per step
        log.setCaloriesBurned(BigDecimal.valueOf(req.steps() * 0.04));
        log.setSource("manual");
        stepLogRepository.save(log);
        return toResponse(log);
    }

    private DailyStepsResponse toResponse(StepLog log) {
        if (log == null) {
            return new DailyStepsResponse(LocalDate.now(), 0, DEFAULT_TARGET, 0, 0, 0);
        }
        int steps = log.getStepCount();
        double distKm = log.getDistanceM() != null
                ? log.getDistanceM().doubleValue() / 1000.0 : steps * 0.00075;
        int cals = log.getCaloriesBurned() != null
                ? log.getCaloriesBurned().intValue() : (int) (steps * 0.04);
        int active = steps / 100; // ~1 min per 100 steps
        return new DailyStepsResponse(log.getDate(), steps, DEFAULT_TARGET,
                Math.round(distKm * 100.0) / 100.0, cals, active);
    }
}
