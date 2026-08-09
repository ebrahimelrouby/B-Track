package com.btrack.modules.auth.service;

import com.btrack.common.email.EmailService;
import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.common.sms.SmsService;
import com.btrack.modules.auth.dto.*;
import com.btrack.modules.auth.entity.PasswordResetToken;
import com.btrack.modules.auth.entity.RefreshToken;
import com.btrack.modules.auth.repository.PasswordResetTokenRepository;
import com.btrack.modules.auth.repository.RefreshTokenRepository;
import com.btrack.modules.auth.security.JwtService;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.repository.SubscriptionRepository;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.entity.UserProfile;
import com.btrack.modules.user.repository.UserProfileRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SmsService smsService;

    private static final long RESET_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
    private static final int RESET_CODE_MAX_ATTEMPTS = 5;

    @Value("${btrack.jwt.refresh-token-expiration}")
    private long refreshTokenExpirationSeconds;

    @Value("${btrack.jwt.access-token-expiration}")
    private long accessTokenExpirationSeconds;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new BTrackException("Email already registered", HttpStatus.CONFLICT, ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.email().toLowerCase())
                .phoneNumber(request.phoneNumber())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .build();
        user = userRepository.save(user);

        // Create empty profile
        UserProfile profile = UserProfile.builder().user(user).build();
        profileRepository.save(profile);

        // Initialize free subscription
        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(Subscription.SubscriptionPlan.FREE)
                .status(Subscription.SubscriptionStatus.ACTIVE)
                .build();
        subscriptionRepository.save(subscription);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BTrackException("Invalid email or password", HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS));

        if (user.getDeletedAt() != null) {
            throw new BTrackException("Account not found", HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BTrackException("Invalid email or password", HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS);
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenHash = hashToken(request.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BTrackException("Invalid refresh token", HttpStatus.UNAUTHORIZED, ErrorCode.REFRESH_TOKEN_INVALID));

        if (stored.isRevoked() || stored.isExpired()) {
            throw new BTrackException("Refresh token expired or revoked", HttpStatus.UNAUTHORIZED, ErrorCode.REFRESH_TOKEN_INVALID);
        }

        // Rotate: revoke old token
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        return buildAuthResponse(stored.getUser());
    }

    @Transactional
    public void logout(String userId) {
        refreshTokenRepository.revokeAllUserTokens(UUID.fromString(userId), Instant.now());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        boolean hasEmail = request.email() != null && !request.email().isBlank();
        boolean hasPhone = request.phoneNumber() != null && !request.phoneNumber().isBlank();
        if (hasEmail == hasPhone) {
            throw new BTrackException("Provide exactly one of email or phoneNumber",
                    HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
        }

        // Always return success to prevent user enumeration
        var userLookup = hasEmail
                ? userRepository.findByEmail(request.email().toLowerCase())
                : userRepository.findByPhoneNumber(request.phoneNumber());

        userLookup.ifPresent(user -> {
            // Invalidate any existing code for this user — also resets the attempt counter,
            // since a fresh request should always get a clean slate.
            passwordResetTokenRepository.deleteAllByUserId(user.getId());

            String code = generateResetCode();
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hashToken(code))
                    .expiresAt(Instant.now().plusSeconds(RESET_TOKEN_TTL_SECONDS))
                    .build();
            passwordResetTokenRepository.save(token);

            // Never let a delivery failure surface here — it would leak, via a 500 vs 200
            // response, whether the account exists at all (the enumeration guard this
            // method exists for). The token is already persisted; failures are just logged.
            try {
                if (hasEmail) {
                    emailService.sendPasswordResetEmail(user.getEmail(), code, RESET_TOKEN_TTL_SECONDS / 60);
                } else {
                    smsService.sendPasswordResetSms(user.getPhoneNumber(), code);
                }
            } catch (Exception e) {
                log.error("Password reset delivery failed for user {}", user.getId(), e);
            }
        });
    }

    // noRollbackFor: the attempt counter must persist even when this method ends by
    // throwing (wrong code, lockout, etc.) — otherwise Spring's default rollback-on-exception
    // undoes the increment along with it, and the attempt cap never actually engages.
    @Transactional(noRollbackFor = BTrackException.class)
    public void resetPassword(ResetPasswordRequest request) {
        boolean hasEmail = request.email() != null && !request.email().isBlank();
        boolean hasPhone = request.phoneNumber() != null && !request.phoneNumber().isBlank();
        if (hasEmail == hasPhone) {
            throw new BTrackException("Provide exactly one of email or phoneNumber",
                    HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
        }

        User user = (hasEmail
                ? userRepository.findByEmail(request.email().toLowerCase())
                : userRepository.findByPhoneNumber(request.phoneNumber()))
                .orElseThrow(() -> new BTrackException("Invalid or expired code",
                        HttpStatus.BAD_REQUEST, ErrorCode.INVALID_CREDENTIALS));

        PasswordResetToken stored = passwordResetTokenRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BTrackException("Invalid or expired code",
                        HttpStatus.BAD_REQUEST, ErrorCode.INVALID_CREDENTIALS));

        if (stored.isExpired() || stored.isUsed()) {
            throw new BTrackException("Code has expired or already been used",
                    HttpStatus.BAD_REQUEST, ErrorCode.INVALID_CREDENTIALS);
        }

        // Count this attempt before checking the code, so a guesser can't dodge the cap
        // by racing requests. Scoped to this user's single active code (see forgotPassword),
        // which bounds brute force to RESET_CODE_MAX_ATTEMPTS tries per requested code.
        stored.setAttempts(stored.getAttempts() + 1);
        if (stored.getAttempts() > RESET_CODE_MAX_ATTEMPTS) {
            passwordResetTokenRepository.delete(stored);
            throw new BTrackException("Too many attempts. Request a new code.",
                    HttpStatus.TOO_MANY_REQUESTS, ErrorCode.INVALID_CREDENTIALS);
        }
        passwordResetTokenRepository.save(stored);

        if (!hashToken(request.code()).equals(stored.getTokenHash())) {
            throw new BTrackException("Invalid or expired code",
                    HttpStatus.BAD_REQUEST, ErrorCode.INVALID_CREDENTIALS);
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        stored.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(stored);

        // Revoke all active refresh tokens so existing sessions are invalidated
        refreshTokenRepository.revokeAllUserTokens(user.getId(), Instant.now());
    }

    private String generateResetCode() {
        int code = new SecureRandom().nextInt(1_000_000);
        return String.format("%06d", code);
    }

    // Fix old logout call that used String UUID
    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllUserTokens(userId, Instant.now());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String rawRefreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(rawRefreshToken))
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpirationSeconds))
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isOnboardingComplete(),
                accessToken,
                rawRefreshToken,
                accessTokenExpirationSeconds
        );
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(token.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
