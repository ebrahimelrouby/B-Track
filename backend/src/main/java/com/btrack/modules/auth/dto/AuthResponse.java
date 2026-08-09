package com.btrack.modules.auth.dto;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String role,
        boolean onboardingComplete,
        String accessToken,
        String refreshToken,
        long accessTokenExpiresIn
) {}
