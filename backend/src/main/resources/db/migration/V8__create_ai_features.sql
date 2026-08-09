-- ─── Extend ai_usage_logs with richer tracking columns ────────────────────────
ALTER TABLE ai_usage_logs
    ADD COLUMN IF NOT EXISTS feature         VARCHAR(60),
    ADD COLUMN IF NOT EXISTS provider        VARCHAR(60),
    ADD COLUMN IF NOT EXISTS model           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
    ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,6);

-- ─── AI Nutrition Estimates ────────────────────────────────────────────────────
CREATE TYPE ai_input_type   AS ENUM ('TEXT', 'PHOTO', 'VOICE');
CREATE TYPE ai_estimate_status AS ENUM ('DRAFT', 'SAVED', 'DISCARDED');

CREATE TABLE ai_nutrition_estimates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_type          ai_input_type NOT NULL,
    input_text          TEXT,
    food_name           VARCHAR(300),
    -- Estimated macros (before user edits)
    estimated_calories  NUMERIC(8,2),
    estimated_protein_g NUMERIC(7,2),
    estimated_carbs_g   NUMERIC(7,2),
    estimated_fat_g     NUMERIC(7,2),
    estimated_fiber_g   NUMERIC(7,2),
    estimated_sugar_g   NUMERIC(7,2),
    estimated_sodium_mg NUMERIC(8,2),
    estimated_serving_g NUMERIC(7,2),
    -- Confirmed macros (after user edits + save)
    confirmed_calories  NUMERIC(8,2),
    confirmed_protein_g NUMERIC(7,2),
    confirmed_carbs_g   NUMERIC(7,2),
    confirmed_fat_g     NUMERIC(7,2),
    confirmed_fiber_g   NUMERIC(7,2),
    confirmed_sugar_g   NUMERIC(7,2),
    confirmed_sodium_mg NUMERIC(8,2),
    confirmed_serving_g NUMERIC(7,2),
    -- AI metadata
    confidence_score    NUMERIC(4,3),              -- 0.000 – 1.000
    assumptions         JSONB,                     -- string[]
    raw_ai_response     JSONB,
    status              ai_estimate_status NOT NULL DEFAULT 'DRAFT',
    meal_type           VARCHAR(30),               -- breakfast|lunch|dinner|snack
    logged_date         DATE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_nutrition_user_id    ON ai_nutrition_estimates(user_id);
CREATE INDEX idx_ai_nutrition_user_date  ON ai_nutrition_estimates(user_id, logged_date);
CREATE INDEX idx_ai_nutrition_status     ON ai_nutrition_estimates(user_id, status);

-- ─── AI Body Fat Estimates ─────────────────────────────────────────────────────
CREATE TABLE ai_body_fat_estimates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Range returned by AI (never a single value)
    min_body_fat_pct        NUMERIC(5,2) NOT NULL,
    max_body_fat_pct        NUMERIC(5,2) NOT NULL,
    confidence_score        NUMERIC(4,3),
    -- User measurements provided at analysis time
    height_cm               NUMERIC(6,2),
    weight_kg               NUMERIC(6,2),
    age                     INTEGER,
    gender                  VARCHAR(30),
    training_experience     VARCHAR(30),
    goal                    VARCHAR(50),
    -- AI outputs
    visual_observations     JSONB,                 -- string[]
    recommendations         JSONB,                 -- string[]
    raw_ai_response         JSONB,
    -- Privacy / consent
    consent_given           BOOLEAN NOT NULL DEFAULT FALSE,
    status                  ai_estimate_status NOT NULL DEFAULT 'DRAFT',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_body_fat_user_id ON ai_body_fat_estimates(user_id);
CREATE INDEX idx_ai_body_fat_status  ON ai_body_fat_estimates(user_id, status);

-- Body photos linked to an estimate (stored as URLs; deleted on cascade)
CREATE TABLE ai_body_fat_photos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id     UUID NOT NULL REFERENCES ai_body_fat_estimates(id) ON DELETE CASCADE,
    photo_angle     VARCHAR(20) NOT NULL,          -- FRONT | SIDE | BACK
    storage_url     VARCHAR(500) NOT NULL,
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_body_fat_photos_estimate ON ai_body_fat_photos(estimate_id);
