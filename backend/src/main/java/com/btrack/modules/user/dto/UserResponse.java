package com.btrack.modules.user.dto;

import com.btrack.modules.user.entity.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        boolean onboardingComplete,
        UserProfileResponse profile
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.isOnboardingComplete(),
                UserProfileResponse.from(user.getProfile())
        );
    }
}
