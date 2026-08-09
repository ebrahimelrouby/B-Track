package com.btrack.modules.auth.security;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpirationSeconds;
    private final long refreshTokenExpirationSeconds;

    public JwtService(
            @Value("${btrack.jwt.secret}") String secret,
            @Value("${btrack.jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${btrack.jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationSeconds = accessTokenExpiration;
        this.refreshTokenExpirationSeconds = refreshTokenExpiration;
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "access");
        claims.put("role", role != null ? role : "USER");
        return buildToken(userId, email, accessTokenExpirationSeconds, claims);
    }

    public String generateRefreshToken(UUID userId, String email) {
        return buildToken(userId, email, refreshTokenExpirationSeconds, Map.of("type", "refresh"));
    }

    private String buildToken(UUID userId, String email, long expirationSeconds, Map<String, Object> extraClaims) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(key)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        } catch (JwtException ex) {
            log.debug("JWT parse failed: {}", ex.getMessage());
            throw new BTrackException("Token is invalid or expired", HttpStatus.UNAUTHORIZED, ErrorCode.TOKEN_INVALID);
        }
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractAllClaims(token).getSubject());
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).get("email", String.class);
    }

    public String extractRole(String token) {
        String role = extractAllClaims(token).get("role", String.class);
        return role != null ? role : "USER";
    }

    public boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractAllClaims(token).get("type", String.class));
    }
}
