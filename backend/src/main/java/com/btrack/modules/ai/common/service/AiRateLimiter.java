package com.btrack.modules.ai.common.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.ai.common.entity.AiUsageLog;
import com.btrack.modules.ai.common.repository.AiUsageLogRepository;
import com.btrack.modules.ai.provider.AiProvider;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiRateLimiter {

    private final AiUsageLogRepository usageLogRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;

    @Value("${btrack.ai.rate-limit.requests-per-day:100}")
    private int dailyLimit;

    public void checkAndRecord(UUID userId, String feature, int tokensUsed, long responseTimeMs) {
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long todayCount = usageLogRepository.countByUserAndFeatureSince(userId, feature, startOfDay);

        if (todayCount >= dailyLimit) {
            throw new BTrackException(
                    "Daily AI usage limit reached. Resets at midnight.",
                    HttpStatus.TOO_MANY_REQUESTS,
                    ErrorCode.AI_DAILY_LIMIT_EXCEEDED
            );
        }

        // gpt-4o pricing: $0.005 per 1K input tokens (approximate)
        BigDecimal cost = BigDecimal.valueOf(tokensUsed).multiply(BigDecimal.valueOf(0.000005));

        AiUsageLog log = AiUsageLog.builder()
                .user(userRepository.getReferenceById(userId))
                .feature(feature)
                .provider(aiProvider.providerName())
                .model("gpt-4o")
                .tokensUsed(tokensUsed)
                .responseTimeMs((int) responseTimeMs)
                .estimatedCostUsd(cost)
                .build();
        usageLogRepository.save(log);
    }
}
