-- Extend sleep_logs with manual-entry fields that were missing in V6
ALTER TABLE sleep_logs
  ADD COLUMN IF NOT EXISTS fell_asleep_at  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS wake_time       TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS mood_after_sleep VARCHAR(20),
  ADD COLUMN IF NOT EXISTS notes           TEXT;

-- Extend water_logs with drink type
ALTER TABLE water_logs
  ADD COLUMN IF NOT EXISTS drink_type VARCHAR(50) NOT NULL DEFAULT 'WATER';

-- Extend water_presets with hydration multiplier (e.g. coffee=0.85, water=1.0)
ALTER TABLE water_presets
  ADD COLUMN IF NOT EXISTS hydration_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00;

-- Sleep goal configuration per user
CREATE TABLE IF NOT EXISTS sleep_goals (
    id                              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    target_hours                    NUMERIC(3,1) NOT NULL DEFAULT 8.0,
    bedtime_goal                    TIME        NOT NULL DEFAULT '23:00:00',
    wake_time_goal                  TIME        NOT NULL DEFAULT '07:00:00',
    bedtime_reminder_enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
    bedtime_reminder_offset_minutes INTEGER     NOT NULL DEFAULT 30,
    wakeup_reminder_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Water goal override per user (supplements targetWaterMl on user_profiles)
CREATE TABLE IF NOT EXISTS water_goals (
    id                          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    daily_target_ml             INTEGER NOT NULL DEFAULT 2500,
    use_auto_calculation        BOOLEAN NOT NULL DEFAULT TRUE,
    hydration_reminder_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_interval_hours     INTEGER NOT NULL DEFAULT 2,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Log every health data sync from Apple Health / Health Connect
CREATE TABLE IF NOT EXISTS health_sync_logs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform        VARCHAR(50) NOT NULL,   -- 'APPLE_HEALTH', 'HEALTH_CONNECT'
    data_type       VARCHAR(100) NOT NULL,  -- 'SLEEP', 'STEPS', 'HEART_RATE', 'WEIGHT'
    records_synced  INTEGER     NOT NULL DEFAULT 0,
    sync_from       TIMESTAMP WITH TIME ZONE,
    sync_to         TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    error_message   TEXT,
    synced_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Extend notification_preferences with sleep / hydration notifications
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS bedtime_reminder         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS bedtime_reminder_time    TIME    NOT NULL DEFAULT '22:30:00',
  ADD COLUMN IF NOT EXISTS sleep_goal_missed        BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS hydration_smart_reminder BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_sleep_goals_user        ON sleep_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_water_goals_user         ON water_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_health_sync_logs_user    ON health_sync_logs(user_id, synced_at);
CREATE INDEX IF NOT EXISTS idx_water_logs_drink_type    ON water_logs(user_id, drink_type);
