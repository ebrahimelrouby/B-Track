package com.btrack.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BTrackException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public BTrackException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public static BTrackException notFound(String message, String errorCode) {
        return new BTrackException(message, HttpStatus.NOT_FOUND, errorCode);
    }

    public static BTrackException forbidden(String message) {
        return new BTrackException(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
    }

    public static BTrackException featureLocked(String featureName) {
        return new BTrackException(
                "'" + featureName + "' requires a Premium subscription.",
                HttpStatus.PAYMENT_REQUIRED,
                ErrorCode.FEATURE_LOCKED
        );
    }

    public static BTrackException planLimitReached(String resource) {
        return new BTrackException(
                "Free plan limit reached for " + resource + ". Upgrade to Premium for unlimited access.",
                HttpStatus.PAYMENT_REQUIRED,
                ErrorCode.PLAN_LIMIT_REACHED
        );
    }

    public static BTrackException badRequest(String message, String errorCode) {
        return new BTrackException(message, HttpStatus.BAD_REQUEST, errorCode);
    }

    public static BTrackException unauthorized(String message) {
        return new BTrackException(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
    }
}
