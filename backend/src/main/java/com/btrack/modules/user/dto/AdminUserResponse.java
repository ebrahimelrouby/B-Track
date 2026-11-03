package com.btrack.modules.user.dto;

import com.btrack.modules.user.entity.User;

import java.time.Instant;
import java.time.Duration;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String role,
        boolean emailVerified,
        boolean onboardingComplete,
        Instant createdAt,
        Instant lastActiveAt,
        boolean online
) {
    // Matches the "online now" threshold used by AdminUserService's stats count.
    private static final Duration ONLINE_THRESHOLD = Duration.ofMinutes(5);

    public static AdminUserResponse from(User u) {
        boolean online = u.getLastActiveAt() != null
                && Duration.between(u.getLastActiveAt(), Instant.now()).compareTo(ONLINE_THRESHOLD) < 0;
        return new AdminUserResponse(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), u.getRole(),
                u.isEmailVerified(), u.isOnboardingComplete(),
                u.getCreatedAt(), u.getLastActiveAt(), online
        );
    }
}
