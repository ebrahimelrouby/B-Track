package com.btrack.modules.auth.dto;

import jakarta.validation.constraints.Email;

/** Exactly one of {@code email} or {@code phoneNumber} must be provided; validated in AuthService. */
public record ForgotPasswordRequest(
        @Email String email,
        String phoneNumber
) {}
