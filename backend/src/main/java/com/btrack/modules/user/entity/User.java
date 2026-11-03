package com.btrack.modules.user.entity;

import com.btrack.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    // Must never be serialized — this entity has been returned directly (bypassing
    // a DTO) from more than one endpoint; @JsonIgnore is the backstop so that class
    // of bug leaks a crash, not a credential. Still: prefer a response DTO over
    // returning this entity at all.
    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "is_onboarding_complete", nullable = false)
    @Builder.Default
    private boolean onboardingComplete = false;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // Touched (throttled) on every authenticated request by
    // UserActivityService — used by the admin portal to show who's online.
    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserProfile profile;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
