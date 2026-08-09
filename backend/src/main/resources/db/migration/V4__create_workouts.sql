CREATE TYPE workout_plan_visibility AS ENUM ('PRIVATE', 'PUBLIC');

-- Workout Plans
CREATE TABLE workout_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    visibility      workout_plan_visibility NOT NULL DEFAULT 'PRIVATE',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workout Days within a plan
CREATE TABLE workout_days (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    day_of_week     day_of_week,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Exercises within a workout day (the plan template)
CREATE TABLE workout_day_exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id          UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    target_sets     INTEGER,
    target_reps_min INTEGER,
    target_reps_max INTEGER,
    target_weight_kg NUMERIC(6,2),
    target_rpe      NUMERIC(3,1),
    rest_seconds    INTEGER DEFAULT 90,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workout Sessions (actual logged workouts)
CREATE TYPE session_status AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

CREATE TABLE workout_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    day_id          UUID REFERENCES workout_days(id) ON DELETE SET NULL,
    name            VARCHAR(200),
    status          session_status NOT NULL DEFAULT 'IN_PROGRESS',
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paused_at       TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_volume_kg  NUMERIC(10,2),
    notes           TEXT,
    is_synced       BOOLEAN NOT NULL DEFAULT TRUE,
    local_session_id VARCHAR(100), -- for offline sync
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Session exercises (exercises actually performed)
CREATE TABLE session_exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Individual sets within a session exercise
CREATE TYPE set_type AS ENUM ('NORMAL', 'WARMUP', 'DROP_SET', 'FAILURE');

CREATE TABLE workout_sets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    set_number      INTEGER NOT NULL,
    set_type        set_type NOT NULL DEFAULT 'NORMAL',
    weight_kg       NUMERIC(6,2),
    reps            INTEGER,
    rpe             NUMERIC(3,1),
    rest_seconds    INTEGER,
    duration_seconds INTEGER, -- for timed exercises
    notes           TEXT,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Personal Records
CREATE TABLE personal_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    weight_kg       NUMERIC(6,2),
    reps            INTEGER,
    estimated_1rm   NUMERIC(6,2),  -- calculated
    achieved_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- Indexes
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_workout_days_plan_id ON workout_days(plan_id);
CREATE INDEX idx_workout_day_exercises_day_id ON workout_day_exercises(day_id);
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at);
CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX idx_workout_sets_session_exercise_id ON workout_sets(session_exercise_id);
CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
