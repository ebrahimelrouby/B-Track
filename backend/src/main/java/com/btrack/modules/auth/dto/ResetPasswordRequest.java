package com.btrack.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Exactly one of {@code email} or {@code phoneNumber} must be provided; validated in AuthService. */
public record ResetPasswordRequest(
        @Email String email,
        String phoneNumber,
        @NotBlank String code,
        @NotBlank @Size(min = 8) String newPassword
) {}
