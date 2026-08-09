CREATE TYPE subscription_plan AS ENUM ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_ANNUAL');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'GRACE_PERIOD', 'TRIAL');
CREATE TYPE platform AS ENUM ('IOS', 'ANDROID', 'WEB');
CREATE TYPE feature_key AS ENUM (
    'UNLIMITED_WORKOUT_PLANS',
    'UNLIMITED_CUSTOM_EXERCISES',
    'ADVANCED_ANALYTICS',
    'FULL_WORKOUT_HISTORY',
    'AI_COACH',
    'APPLE_WATCH_SYNC',
    'UNLIMITED_PROGRESS_PHOTOS',
    'ADVANCED_NUTRITION_TARGETS',
    'MEAL_TEMPLATES',
    'RECIPE_BUILDER',
    'CUSTOM_WATER_PRESETS',
    'DATA_EXPORT',
    'PRIORITY_CLOUD_BACKUP',
    'ADVANCED_PR_TRACKING',
    'MUSCLE_GROUP_ANALYTICS'
);

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan                    subscription_plan NOT NULL DEFAULT 'FREE',
    status                  subscription_status NOT NULL DEFAULT 'ACTIVE',
    platform                platform,
    store_product_id        VARCHAR(255),
    store_transaction_id    VARCHAR(500),
    store_original_transaction_id VARCHAR(500),
    purchase_token          TEXT,
    starts_at               TIMESTAMP WITH TIME ZONE,
    expires_at              TIMESTAMP WITH TIME ZONE,
    cancelled_at            TIMESTAMP WITH TIME ZONE,
    auto_renew              BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Maps which features are available per plan
CREATE TABLE plan_features (
    id          BIGSERIAL PRIMARY KEY,
    plan        subscription_plan NOT NULL,
    feature     feature_key NOT NULL,
    UNIQUE(plan, feature)
);

-- Seed plan features
INSERT INTO plan_features (plan, feature) VALUES
-- Free plan features (none of the premium ones needed here — absence = locked)
-- Premium features
('PREMIUM_MONTHLY', 'UNLIMITED_WORKOUT_PLANS'),
('PREMIUM_MONTHLY', 'UNLIMITED_CUSTOM_EXERCISES'),
('PREMIUM_MONTHLY', 'ADVANCED_ANALYTICS'),
('PREMIUM_MONTHLY', 'FULL_WORKOUT_HISTORY'),
('PREMIUM_MONTHLY', 'AI_COACH'),
('PREMIUM_MONTHLY', 'APPLE_WATCH_SYNC'),
('PREMIUM_MONTHLY', 'UNLIMITED_PROGRESS_PHOTOS'),
('PREMIUM_MONTHLY', 'ADVANCED_NUTRITION_TARGETS'),
('PREMIUM_MONTHLY', 'MEAL_TEMPLATES'),
('PREMIUM_MONTHLY', 'RECIPE_BUILDER'),
('PREMIUM_MONTHLY', 'CUSTOM_WATER_PRESETS'),
('PREMIUM_MONTHLY', 'DATA_EXPORT'),
('PREMIUM_MONTHLY', 'PRIORITY_CLOUD_BACKUP'),
('PREMIUM_MONTHLY', 'ADVANCED_PR_TRACKING'),
('PREMIUM_MONTHLY', 'MUSCLE_GROUP_ANALYTICS'),
-- Annual plan = same as monthly
('PREMIUM_ANNUAL', 'UNLIMITED_WORKOUT_PLANS'),
('PREMIUM_ANNUAL', 'UNLIMITED_CUSTOM_EXERCISES'),
('PREMIUM_ANNUAL', 'ADVANCED_ANALYTICS'),
('PREMIUM_ANNUAL', 'FULL_WORKOUT_HISTORY'),
('PREMIUM_ANNUAL', 'AI_COACH'),
('PREMIUM_ANNUAL', 'APPLE_WATCH_SYNC'),
('PREMIUM_ANNUAL', 'UNLIMITED_PROGRESS_PHOTOS'),
('PREMIUM_ANNUAL', 'ADVANCED_NUTRITION_TARGETS'),
('PREMIUM_ANNUAL', 'MEAL_TEMPLATES'),
('PREMIUM_ANNUAL', 'RECIPE_BUILDER'),
('PREMIUM_ANNUAL', 'CUSTOM_WATER_PRESETS'),
('PREMIUM_ANNUAL', 'DATA_EXPORT'),
('PREMIUM_ANNUAL', 'PRIORITY_CLOUD_BACKUP'),
('PREMIUM_ANNUAL', 'ADVANCED_PR_TRACKING'),
('PREMIUM_ANNUAL', 'MUSCLE_GROUP_ANALYTICS');

-- Free plan limits
CREATE TABLE free_plan_limits (
    id              BIGSERIAL PRIMARY KEY,
    resource        VARCHAR(100) NOT NULL UNIQUE,
    max_count       INTEGER NOT NULL
);

INSERT INTO free_plan_limits (resource, max_count) VALUES
('workout_plans', 3),
('custom_exercises', 10),
('workout_history_days', 30),
('progress_photos', 5);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
