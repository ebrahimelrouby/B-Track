package com.btrack.modules.sleep.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.sleep.dto.DailySleepResponse;
import com.btrack.modules.sleep.dto.SleepLogRequest;
import com.btrack.modules.sleep.dto.SleepLogResponse;
import com.btrack.modules.sleep.entity.SleepLog;
import com.btrack.modules.sleep.repository.SleepLogRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SleepService {

    private static final int DEFAULT_TARGET_MINUTES = 480;

    private final SleepLogRepository sleepLogRepository;
    private final UserRepository userRepository;

    public DailySleepResponse getToday(UUID userId) {
        return toDaily(userId, LocalDate.now(), sleepLogRepository
                .findByUserIdAndDate(userId, LocalDate.now())
                .map(List::of).orElse(List.of()));
    }

    public List<DailySleepResponse> getHistory(UUID userId, int days) {
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        return sleepLogRepository.findByUserIdSince(userId, from)
                .stream()
                .map(log -> toDaily(userId, log.getDate(), List.of(log)))
                .toList();
    }

    @Transactional
    public SleepLogResponse logSleep(UUID userId, SleepLogRequest req) {
        Instant bedtime  = Instant.parse(req.bedtime());
        Instant wakeTime = Instant.parse(req.wakeTime());
        int durationMins = (int) ((wakeTime.toEpochMilli() - bedtime.toEpochMilli()) / 60_000);

        // Upsert: one log per date per user
        SleepLog log = sleepLogRepository.findByUserIdAndDate(userId, req.date())
                .orElse(SleepLog.builder()
                        .user(userRepository.getReferenceById(userId))
                        .date(req.date())
                        .build());

        log.setSleepStart(bedtime);
        log.setSleepEnd(wakeTime);
        log.setFellAsleepAt(bedtime);
        log.setWakeTime(wakeTime);
        log.setDurationMinutes(Math.max(0, durationMins));
        log.setQualityScore(qualityToScore(req.quality()));
        log.setMoodAfterSleep(req.quality());
        log.setNotes(req.notes());
        log.setSource(req.source() != null ? req.source() : "manual");
        sleepLogRepository.save(log);
        return toResponse(log);
    }

    @Transactional
    public void deleteSleepLog(UUID userId, UUID logId) {
        SleepLog log = sleepLogRepository.findById(logId)
                .orElseThrow(() -> BTrackException.notFound("Sleep log not found", ErrorCode.RESOURCE_NOT_FOUND));
        if (!log.getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }
        sleepLogRepository.delete(log);
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private DailySleepResponse toDaily(UUID userId, LocalDate date, List<SleepLog> logs) {
        int total = logs.stream().mapToInt(SleepLog::getDurationMinutes).sum();
        String quality = logs.isEmpty() ? null : qualityLabel(logs.get(0).getQualityScore());
        return new DailySleepResponse(date, logs.stream().map(this::toResponse).toList(),
                total, targetMinutesFor(userId), quality);
    }

    private int targetMinutesFor(UUID userId) {
        return userRepository.findByIdWithProfile(userId)
                .map(u -> u.getProfile())
                .map(p -> p.getTargetSleepHours())
                .map(hours -> (int) Math.round(hours * 60))
                .orElse(DEFAULT_TARGET_MINUTES);
    }

    private SleepLogResponse toResponse(SleepLog log) {
        return new SleepLogResponse(
                log.getId(),
                log.getDate(),
                log.getSleepStart() != null ? log.getSleepStart().toString() : null,
                log.getSleepEnd() != null ? log.getSleepEnd().toString() : null,
                log.getDurationMinutes(),
                qualityLabel(log.getQualityScore()),
                log.getNotes(),
                log.getCreatedAt() != null ? log.getCreatedAt().toString() : null
        );
    }

    private Integer qualityToScore(String quality) {
        if (quality == null) return null;
        return switch (quality.toUpperCase()) {
            case "EXCELLENT" -> 90;
            case "GOOD"      -> 75;
            case "FAIR"      -> 55;
            case "POOR"      -> 30;
            default          -> null;
        };
    }

    private String qualityLabel(Integer score) {
        if (score == null) return null;
        if (score >= 80) return "EXCELLENT";
        if (score >= 65) return "GOOD";
        if (score >= 45) return "FAIR";
        return "POOR";
    }
}
