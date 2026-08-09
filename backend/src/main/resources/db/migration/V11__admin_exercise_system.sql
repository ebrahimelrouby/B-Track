-- Exercise status workflow
CREATE TYPE exercise_status AS ENUM ('DRAFT', 'REVIEWED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- Extend exercises table with admin-managed fields
ALTER TABLE exercises
    ADD COLUMN status exercise_status NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN slug VARCHAR(300) UNIQUE,
    ADD COLUMN description TEXT,
    ADD COLUMN category VARCHAR(100),
    ADD COLUMN movement_pattern VARCHAR(100),
    ADD COLUMN mechanic VARCHAR(50),
    ADD COLUMN force_type VARCHAR(50),
    ADD COLUMN common_mistakes TEXT,
    ADD COLUMN license_type VARCHAR(100) DEFAULT 'unknown',
    ADD COLUMN attribution TEXT,
    ADD COLUMN source_provider VARCHAR(100),
    ADD COLUMN external_id VARCHAR(300),
    ADD COLUMN quality_score INTEGER DEFAULT 0,
    ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN tags TEXT[];

-- All existing seeded exercises go straight to PUBLISHED
UPDATE exercises SET status = 'PUBLISHED', published_at = NOW() WHERE is_custom = FALSE;

-- Generate slugs for existing exercises
UPDATE exercises
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Exercise media table
CREATE TABLE exercise_media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    media_type      VARCHAR(50) NOT NULL,  -- IMAGE | GIF | VIDEO | THUMBNAIL | SVG_OVERLAY | LOTTIE
    url             VARCHAR(2000) NOT NULL,
    provider        VARCHAR(200),
    license_type    VARCHAR(100),
    author          VARCHAR(200),
    source_url      VARCHAR(2000),
    attribution     TEXT,
    commercial_use  BOOLEAN DEFAULT FALSE,
    display_order   INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Exercise translations table (EN is the canonical row, AR and others here)
CREATE TABLE exercise_translations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    locale          VARCHAR(10) NOT NULL,  -- 'ar', 'fr', etc.
    name            VARCHAR(200),
    description     TEXT,
    instructions    TEXT,
    tips            TEXT,
    common_mistakes TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (exercise_id, locale)
);

-- Import history / pipeline tracking
CREATE TABLE exercise_import_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider        VARCHAR(100) NOT NULL,
    dataset_version VARCHAR(100),
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',  -- PENDING | PROCESSING | COMPLETED | FAILED | ROLLED_BACK
    imported_count  INTEGER DEFAULT 0,
    updated_count   INTEGER DEFAULT 0,
    skipped_count   INTEGER DEFAULT 0,
    error_count     INTEGER DEFAULT 0,
    warning_count   INTEGER DEFAULT 0,
    media_count     INTEGER DEFAULT 0,
    duration_ms     BIGINT,
    errors          JSONB DEFAULT '[]'::jsonb,
    warnings        JSONB DEFAULT '[]'::jsonb,
    report          JSONB DEFAULT '{}'::jsonb,
    imported_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    rolled_back_at  TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Admin action audit log
CREATE TABLE exercise_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,   -- CREATE | UPDATE | STATUS_CHANGE | DELETE | IMPORT | BULK_EDIT ...
    entity_type     VARCHAR(100) NOT NULL DEFAULT 'EXERCISE',
    entity_id       UUID,
    entity_name     VARCHAR(300),
    before_value    JSONB,
    after_value     JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exercises_status             ON exercises(status);
CREATE INDEX idx_exercises_slug               ON exercises(slug);
CREATE INDEX idx_exercises_source_provider    ON exercises(source_provider);
CREATE INDEX idx_exercises_quality_score      ON exercises(quality_score);
CREATE INDEX idx_exercise_media_exercise_id   ON exercise_media(exercise_id);
CREATE INDEX idx_exercise_media_type          ON exercise_media(media_type);
CREATE INDEX idx_exercise_trans_exercise_id   ON exercise_translations(exercise_id);
CREATE INDEX idx_import_history_provider      ON exercise_import_history(provider);
CREATE INDEX idx_import_history_status        ON exercise_import_history(status);
CREATE INDEX idx_audit_log_entity_id          ON exercise_audit_log(entity_id);
CREATE INDEX idx_audit_log_admin_user_id      ON exercise_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_created_at         ON exercise_audit_log(created_at);
