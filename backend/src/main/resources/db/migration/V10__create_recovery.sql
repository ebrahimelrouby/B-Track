-- Recovery scores: one row per user per day, upserted on recalculate
CREATE TABLE recovery_scores (
    id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_date                  DATE         NOT NULL,
    final_score                 INTEGER      NOT NULL,
    recovery_level              VARCHAR(60)  NOT NULL,
    confidence                  NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    sleep_score                 INTEGER,
    training_load_score         INTEGER,
    heart_recovery_score        INTEGER,
    hydration_score             INTEGER,
    subjective_wellness_score   INTEGER,
    -- Full component details (score, status, explanation) stored for fast reads
    components                  JSONB,
    explanation                 TEXT,
    -- List of strings describing missing data sources
    missing_data                JSONB,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, score_date)
);

-- Actionable recommendations attached to each recovery score
CREATE TABLE recovery_recommendations (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    recovery_score_id   UUID         NOT NULL REFERENCES recovery_scores(id) ON DELETE CASCADE,
    type                VARCHAR(50)  NOT NULL,   -- TRAINING, SLEEP, HYDRATION, NUTRITION, GENERAL
    title               VARCHAR(200) NOT NULL,
    description         TEXT         NOT NULL,
    priority            INTEGER      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Daily subjective wellness check-in (one per user per day)
CREATE TABLE recovery_check_ins (
    id               UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_date    DATE    NOT NULL,
    energy_level     INTEGER NOT NULL CHECK (energy_level     BETWEEN 1 AND 5),
    soreness_level   INTEGER NOT NULL CHECK (soreness_level   BETWEEN 1 AND 5),
    stress_level     INTEGER NOT NULL CHECK (stress_level     BETWEEN 1 AND 5),
    mood_level       INTEGER NOT NULL CHECK (mood_level       BETWEEN 1 AND 5),
    motivation_level INTEGER NOT NULL CHECK (motivation_level BETWEEN 1 AND 5),
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, check_in_date)
);

CREATE INDEX idx_recovery_scores_user_date ON recovery_scores(user_id, score_date DESC);
CREATE INDEX idx_recovery_check_ins_user   ON recovery_check_ins(user_id, check_in_date DESC);
CREATE INDEX idx_recovery_recs_score       ON recovery_recommendations(recovery_score_id);
