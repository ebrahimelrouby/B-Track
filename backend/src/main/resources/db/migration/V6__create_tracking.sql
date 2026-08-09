-- Water logs
CREATE TABLE water_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ml       INTEGER NOT NULL,
    logged_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes           VARCHAR(200),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Custom drink presets (premium)
CREATE TABLE water_presets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    amount_ml       INTEGER NOT NULL,
    icon            VARCHAR(50),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step logs (synced from HealthKit / Health Connect)
CREATE TABLE step_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_count      INTEGER NOT NULL,
    date            DATE NOT NULL,
    calories_burned NUMERIC(7,1),
    distance_m      NUMERIC(8,1),
    source          VARCHAR(100), -- 'healthkit', 'health_connect', 'manual'
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Sleep logs
CREATE TABLE sleep_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_start     TIMESTAMP WITH TIME ZONE NOT NULL,
    sleep_end       TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    quality_score   INTEGER, -- 1-100
    source          VARCHAR(100),
    date            DATE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Body measurements
CREATE TABLE body_measurements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    weight_kg       NUMERIC(5,2),
    body_fat_pct    NUMERIC(4,1),
    waist_cm        NUMERIC(5,1),
    chest_cm        NUMERIC(5,1),
    left_arm_cm     NUMERIC(5,1),
    right_arm_cm    NUMERIC(5,1),
    left_thigh_cm   NUMERIC(5,1),
    right_thigh_cm  NUMERIC(5,1),
    shoulders_cm    NUMERIC(5,1),
    hips_cm         NUMERIC(5,1),
    neck_cm         NUMERIC(5,1),
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Progress photos (premium = unlimited, free = 5 max)
CREATE TABLE progress_photos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measurement_id  UUID REFERENCES body_measurements(id) ON DELETE SET NULL,
    photo_url       VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    date            DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, logged_at);
CREATE INDEX idx_step_logs_user_date ON step_logs(user_id, date);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, date);
CREATE INDEX idx_progress_photos_user_date ON progress_photos(user_id, date);
