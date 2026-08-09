package com.btrack.common.exception;

public final class ErrorCode {
    // Auth
    public static final String INVALID_CREDENTIALS = "AUTH_001";
    public static final String TOKEN_EXPIRED = "AUTH_002";
    public static final String TOKEN_INVALID = "AUTH_003";
    public static final String EMAIL_ALREADY_EXISTS = "AUTH_004";
    public static final String REFRESH_TOKEN_INVALID = "AUTH_005";
    public static final String UNAUTHORIZED = "AUTH_006";

    // User
    public static final String USER_NOT_FOUND = "USER_001";
    public static final String PROFILE_NOT_FOUND = "USER_002";

    // Subscription
    public static final String FEATURE_LOCKED = "SUB_001";
    public static final String PLAN_LIMIT_REACHED = "SUB_002";
    public static final String SUBSCRIPTION_NOT_FOUND = "SUB_003";
    public static final String PURCHASE_VERIFICATION_FAILED = "SUB_004";

    // Workout
    public static final String WORKOUT_PLAN_NOT_FOUND = "WRK_001";
    public static final String WORKOUT_DAY_NOT_FOUND = "WRK_002";
    public static final String SESSION_NOT_FOUND = "WRK_003";
    public static final String SESSION_ALREADY_COMPLETED = "WRK_004";
    public static final String EXERCISE_NOT_FOUND = "WRK_005";

    // Nutrition
    public static final String FOOD_ITEM_NOT_FOUND = "NUT_001";
    public static final String MEAL_NOT_FOUND = "NUT_002";

    // AI
    public static final String AI_DAILY_LIMIT_EXCEEDED = "AI_001";
    public static final String AI_INVALID_IMAGE = "AI_002";
    public static final String AI_ESTIMATE_NOT_FOUND = "AI_003";
    public static final String AI_PROVIDER_ERROR = "AI_004";
    public static final String AI_CONSENT_REQUIRED = "AI_005";

    // Recovery
    public static final String RECOVERY_SCORE_NOT_FOUND      = "REC_001";
    public static final String RECOVERY_CHECK_IN_NOT_FOUND   = "REC_002";
    public static final String CHECK_IN_ALREADY_EXISTS        = "REC_003";

    // General
    public static final String VALIDATION_ERROR = "GEN_001";
    public static final String RESOURCE_NOT_FOUND = "GEN_002";
    public static final String FORBIDDEN = "GEN_003";
    public static final String INTERNAL_ERROR = "GEN_004";
    public static final String RATE_LIMIT_EXCEEDED = "GEN_005";

    private ErrorCode() {}
}
