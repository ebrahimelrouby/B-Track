package com.btrack.modules.water.service;

import com.btrack.modules.user.repository.UserRepository;
import com.btrack.modules.water.dto.WaterLogRequest;
import com.btrack.modules.water.entity.WaterLog;
import com.btrack.modules.water.repository.WaterLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WaterService {

    private final WaterLogRepository waterLogRepository;
    private final UserRepository userRepository;

    public long getTotalForDate(UUID userId, LocalDate date) {
        Instant start = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant end   = date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        return waterLogRepository.sumAmountMlBetween(userId, start, end).orElse(0L);
    }

    @Transactional
    public void logWater(UUID userId, LocalDate date, WaterLogRequest req) {
        Instant loggedAt = date.atStartOfDay().toInstant(ZoneOffset.UTC);
        WaterLog log = WaterLog.builder()
                .user(userRepository.getReferenceById(userId))
                .amountMl(req.ml())
                .loggedAt(loggedAt)
                .drinkType(req.drinkType() != null ? req.drinkType() : "WATER")
                .notes(req.notes())
                .build();
        waterLogRepository.save(log);
    }
}
