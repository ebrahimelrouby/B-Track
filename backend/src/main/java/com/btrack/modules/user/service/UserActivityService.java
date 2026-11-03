package com.btrack.modules.user.service;

import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// Called from JwtAuthenticationFilter on every authenticated request — throttled
// to at most one DB write per user per minute (via an in-memory last-write cache)
// so "who's online" tracking doesn't add a write to every single API call.
@Service
@RequiredArgsConstructor
public class UserActivityService {

    private static final Duration THROTTLE = Duration.ofMinutes(1);

    private final UserRepository userRepository;
    private final ConcurrentHashMap<UUID, Instant> lastWritten = new ConcurrentHashMap<>();

    @Async
    @Transactional
    public void touch(UUID userId) {
        Instant now = Instant.now();
        Instant previous = lastWritten.get(userId);
        if (previous != null && Duration.between(previous, now).compareTo(THROTTLE) < 0) {
            return;
        }
        lastWritten.put(userId, now);
        userRepository.touchLastActiveAt(userId, now);
    }
}
