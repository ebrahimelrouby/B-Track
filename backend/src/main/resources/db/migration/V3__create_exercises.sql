CREATE TYPE muscle_group AS ENUM (
    'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS',
    'CORE', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'CALVES',
    'FULL_BODY', 'CARDIO', 'OTHER'
);

CREATE TYPE equipment_type AS ENUM (
    'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT',
    'KETTLEBELL', 'RESISTANCE_BAND', 'SMITH_MACHINE', 'OTHER'
);

CREATE TYPE exercise_difficulty AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

CREATE TABLE exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    muscle_group    muscle_group NOT NULL,
    secondary_muscles muscle_group[],
    equipment       equipment_type NOT NULL DEFAULT 'BODYWEIGHT',
    difficulty      exercise_difficulty NOT NULL DEFAULT 'INTERMEDIATE',
    instructions    TEXT,
    tips            TEXT,
    image_url       VARCHAR(500),
    gif_url         VARCHAR(500),
    is_custom       BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed with common exercises
INSERT INTO exercises (name, muscle_group, equipment, difficulty, instructions) VALUES
-- Chest
('Barbell Bench Press', 'CHEST', 'BARBELL', 'INTERMEDIATE', 'Lie flat on bench. Grip bar slightly wider than shoulder width. Lower bar to chest. Press up explosively.'),
('Incline Dumbbell Press', 'CHEST', 'DUMBBELL', 'INTERMEDIATE', 'Set bench to 30-45 degrees. Press dumbbells up from chest level.'),
('Push-Up', 'CHEST', 'BODYWEIGHT', 'BEGINNER', 'Start in plank position. Lower chest to floor. Push back up keeping core tight.'),
('Cable Flye', 'CHEST', 'CABLE', 'INTERMEDIATE', 'Stand between cable towers. With slight elbow bend, bring hands together in arc.'),
('Dips', 'CHEST', 'BODYWEIGHT', 'INTERMEDIATE', 'Support body on parallel bars. Lower until upper arms are parallel. Press back up.'),
-- Back
('Pull-Up', 'BACK', 'BODYWEIGHT', 'INTERMEDIATE', 'Hang from bar with overhand grip. Pull chest to bar. Lower with control.'),
('Barbell Deadlift', 'BACK', 'BARBELL', 'ADVANCED', 'Stand with feet hip-width. Hinge at hips. Grip bar. Drive through heels to stand.'),
('Bent-Over Barbell Row', 'BACK', 'BARBELL', 'INTERMEDIATE', 'Hinge forward at hips. Pull bar to lower chest. Squeeze shoulder blades.'),
('Lat Pulldown', 'BACK', 'CABLE', 'BEGINNER', 'Grip bar wider than shoulders. Pull to upper chest. Control the return.'),
('Seated Cable Row', 'BACK', 'CABLE', 'BEGINNER', 'Sit upright. Pull handle to abdomen. Squeeze back muscles.'),
-- Shoulders
('Overhead Press', 'SHOULDERS', 'BARBELL', 'INTERMEDIATE', 'Stand with feet shoulder-width. Press bar from shoulder to overhead. Lock out arms.'),
('Dumbbell Lateral Raise', 'SHOULDERS', 'DUMBBELL', 'BEGINNER', 'Stand tall. Raise dumbbells to sides to shoulder height. Control descent.'),
('Face Pull', 'SHOULDERS', 'CABLE', 'BEGINNER', 'Pull rope attachment to face level. Rotate shoulders externally.'),
-- Legs
('Back Squat', 'QUADRICEPS', 'BARBELL', 'INTERMEDIATE', 'Bar on upper back. Feet shoulder-width. Squat until thighs parallel. Drive up.'),
('Romanian Deadlift', 'HAMSTRINGS', 'BARBELL', 'INTERMEDIATE', 'Stand with bar. Hinge at hips with slight knee bend. Feel hamstring stretch.'),
('Leg Press', 'QUADRICEPS', 'MACHINE', 'BEGINNER', 'Seat in machine. Place feet on platform. Press until legs nearly straight.'),
('Lunges', 'QUADRICEPS', 'BODYWEIGHT', 'BEGINNER', 'Step forward. Lower back knee toward floor. Push back to start.'),
('Leg Curl', 'HAMSTRINGS', 'MACHINE', 'BEGINNER', 'Lie prone. Curl legs toward glutes. Control descent.'),
('Calf Raise', 'CALVES', 'BODYWEIGHT', 'BEGINNER', 'Stand on step edge. Rise on toes. Lower heel below step.'),
-- Arms
('Barbell Curl', 'BICEPS', 'BARBELL', 'BEGINNER', 'Stand with barbell. Curl to shoulder height. Lower with control.'),
('Dumbbell Hammer Curl', 'BICEPS', 'DUMBBELL', 'BEGINNER', 'Neutral grip. Curl dumbbells keeping palms facing each other.'),
('Tricep Pushdown', 'TRICEPS', 'CABLE', 'BEGINNER', 'Grip bar overhead. Push down until arms straight. Control return.'),
('Skull Crusher', 'TRICEPS', 'BARBELL', 'INTERMEDIATE', 'Lie on bench. Lower bar to forehead. Extend arms.'),
-- Core
('Plank', 'CORE', 'BODYWEIGHT', 'BEGINNER', 'Hold body straight on forearms and toes. Keep core braced.'),
('Crunches', 'CORE', 'BODYWEIGHT', 'BEGINNER', 'Lie on back. Curl shoulders toward knees. Lower with control.'),
('Russian Twist', 'CORE', 'BODYWEIGHT', 'INTERMEDIATE', 'Sit with knees bent. Lean back slightly. Rotate torso side to side.');

CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
CREATE INDEX idx_exercises_is_custom ON exercises(is_custom);
