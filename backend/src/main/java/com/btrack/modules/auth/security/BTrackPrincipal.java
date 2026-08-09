package com.btrack.modules.auth.security;

import lombok.Getter;

import java.util.UUID;

@Getter
public class BTrackPrincipal {
    private final UUID userId;
    private final String email;
    private final String role;

    public BTrackPrincipal(UUID userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role != null ? role : "USER";
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role) || "SUPER_ADMIN".equals(role);
    }

    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equals(role);
    }
}
