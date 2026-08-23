-- Demo/dummy data for the seeded admin@btrack.app account so every screen and
-- chart (workouts, nutrition, sleep, steps, water, measurements, recovery)
-- has realistic historical data to render instead of an empty state.
-- Safe no-op if that user doesn't exist (every insert is CROSS JOINed to it).

CREATE TEMP TABLE demo_user AS
SELECT id AS user_id FROM users WHERE email = 'admin@btrack.app';

-- ── Profile ─────────────────────────────────────────────────────────────────

UPDATE user_profiles p
SET gender = 'MALE',
    date_of_birth = DATE '1996-04-12',
    height_cm = 180.0,
    weight_kg = 86.0,
    target_weight_kg = 82.0,
    fitness_goal = 'GAIN_MUSCLE',
    activity_level = 'MODERATELY_ACTIVE',
    training_experience = 'INTERMEDIATE',
    target_calories = 2600,
    target_protein_g = 180,
    target_carbs_g = 280,
    target_fats_g = 80,
    target_water_ml = 3000,
    target_steps = 10000,
    target_sleep_hours = 8.0
FROM demo_user du
WHERE p.user_id = du.user_id;

-- ── Body measurements — every 2 days over ~60 days, trending down ─────────────

INSERT INTO body_measurements (
    id, user_id, date, weight_kg, body_fat_pct, waist_cm, chest_cm,
    left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm, shoulders_cm, hips_cm, neck_cm
)
SELECT
    uuid_generate_v4(), du.user_id, CURRENT_DATE - x.day_offset,
    ROUND((86.0 + x.day_offset * 0.10 + (random() * 1.0 - 0.5))::numeric, 1),
    ROUND((20.0 + x.day_offset * 0.05 + (random() * 0.6 - 0.3))::numeric, 1),
    ROUND((84.0 + x.day_offset * 0.06)::numeric, 1),
    ROUND((104.0 - x.day_offset * 0.02)::numeric, 1),
    ROUND((37.5 - x.day_offset * 0.01)::numeric, 1),
    ROUND((38.0 - x.day_offset * 0.01)::numeric, 1),
    ROUND((58.0 - x.day_offset * 0.01)::numeric, 1),
    ROUND((58.5 - x.day_offset * 0.01)::numeric, 1),
    ROUND((118.0 - x.day_offset * 0.01)::numeric, 1),
    ROUND((98.0 + x.day_offset * 0.02)::numeric, 1),
    39.5
FROM (SELECT g AS day_offset FROM generate_series(0, 58, 2) g) x
CROSS JOIN demo_user du;

-- ── Sleep — daily for 60 days ──────────────────────────────────────────────

INSERT INTO sleep_logs (
    id, user_id, sleep_start, sleep_end, duration_minutes, quality_score,
    source, date, fell_asleep_at, wake_time
)
SELECT
    uuid_generate_v4(), du.user_id,
    x.sleep_start,
    x.sleep_start + (x.duration_minutes || ' minutes')::interval,
    x.duration_minutes,
    x.quality_score,
    'manual',
    CURRENT_DATE - x.day_offset,
    x.sleep_start,
    x.sleep_start + (x.duration_minutes || ' minutes')::interval
FROM (
    SELECT
        g AS day_offset,
        ((CURRENT_DATE - g - 1)::timestamp
            + make_interval(hours => (22 + floor(random() * 2))::int, mins => floor(random() * 60)::int)) AS sleep_start,
        (360 + floor(random() * 150))::int AS duration_minutes,
        (55 + floor(random() * 40))::int AS quality_score
    FROM generate_series(0, 59) g
) x
CROSS JOIN demo_user du;

-- ── Steps — daily for 60 days ───────────────────────────────────────────────

INSERT INTO step_logs (id, user_id, step_count, date, calories_burned, distance_m, source)
SELECT
    uuid_generate_v4(), du.user_id, x.steps, CURRENT_DATE - x.day_offset,
    ROUND((x.steps * 0.04)::numeric, 1), ROUND((x.steps * 0.78)::numeric, 1), 'manual'
FROM (SELECT g AS day_offset, (3500 + floor(random() * 9500))::int AS steps FROM generate_series(0, 59) g) x
CROSS JOIN demo_user du;

-- ── Water — several entries/day for 21 days ─────────────────────────────────

INSERT INTO water_logs (id, user_id, amount_ml, logged_at, drink_type)
SELECT
    uuid_generate_v4(), du.user_id, (150 + floor(random() * 350))::int,
    (CURRENT_DATE - g.day_offset)::timestamp
        + make_interval(hours => (7 + floor(random() * 14))::int, mins => floor(random() * 60)::int),
    CASE WHEN random() < 0.75 THEN 'WATER' WHEN random() < 0.9 THEN 'COFFEE' ELSE 'TEA' END
FROM generate_series(0, 20) AS g(day_offset)
CROSS JOIN demo_user du
-- The upper bound has to reference g.day_offset or Postgres treats this
-- LATERAL as uncorrelated and reuses the same entry count for every day.
CROSS JOIN LATERAL generate_series(1, (3 + floor(random() * 4) + 0 * g.day_offset)::int) AS entry_num;

-- ── Food catalog ────────────────────────────────────────────────────────────

INSERT INTO food_items (name, serving_size_g, calories, protein_g, carbs_g, fats_g, fiber_g, sugar_g, sodium_mg, is_verified) VALUES
('Chicken Breast (Grilled)',   150, 248, 46.5, 0,  5.4, 0,   0,    74,  TRUE),
('White Rice (Cooked)',        150, 195, 4,    42, 0.4, 0.6, 0.1,  2,   TRUE),
('Brown Rice (Cooked)',        150, 170, 3.5,  36, 1.4, 2.4, 0.5,  5,   TRUE),
('Oats (Dry)',                 50,  190, 8.5,  33, 3.5, 5,   0.5,  2,   TRUE),
('Whole Eggs',                 100, 155, 13,   1.1,11,  0,   1.1,  124, TRUE),
('Banana',                     118, 105, 1.3,  27, 0.4, 3.1, 14,   1,   TRUE),
('Greek Yogurt (Plain)',       170, 100, 17,   6,  0.7, 0,   6,    61,  TRUE),
('Salmon (Grilled)',           150, 280, 39,   0,  13,  0,   0,    75,  TRUE),
('Broccoli (Steamed)',         100, 35,  2.4,  7,  0.4, 3.3, 1.7,  41,  TRUE),
('Sweet Potato (Baked)',       150, 135, 2.4,  31, 0.2, 4.5, 6.5,  54,  TRUE),
('Avocado',                    100, 160, 2,    8.5,14.7,6.7, 0.7,  7,   TRUE),
('Almonds',                    30,  174, 6.4,  6.1,15,  3.5, 1.2,  0,   TRUE),
('Whey Protein Powder',        32,  120, 24,   3,  1.5, 0,   2,    50,  TRUE),
('Peanut Butter',              32,  190, 8,    7,  16,  2,   3,    140, TRUE),
('Whole Wheat Bread',          56,  140, 6,    24, 2,   4,   3,    220, TRUE),
('Apple',                      182, 95,  0.5,  25, 0.3, 4.4, 19,   2,   TRUE),
('Ground Beef (90% lean)',     150, 290, 36,   0,  15,  0,   0,    95,  TRUE),
('Cottage Cheese',             150, 145, 20,   6,  3.5, 0,   4.5,  350, TRUE);

-- ── Meals — 3-4/day for 21 days ─────────────────────────────────────────────

CREATE TEMP TABLE demo_meals AS
WITH meal_defs AS (
    SELECT g.day_offset, m.meal_type
    FROM generate_series(0, 20) AS g(day_offset)
    CROSS JOIN (VALUES ('BREAKFAST'::meal_type), ('LUNCH'::meal_type), ('DINNER'::meal_type)) AS m(meal_type)
    UNION ALL
    SELECT g.day_offset, 'SNACK'::meal_type
    FROM generate_series(0, 20) AS g(day_offset)
    WHERE random() < 0.5
),
ins AS (
    INSERT INTO meals (id, user_id, meal_type, logged_date)
    SELECT uuid_generate_v4(), du.user_id, md.meal_type, CURRENT_DATE - md.day_offset
    FROM meal_defs md CROSS JOIN demo_user du
    RETURNING id, logged_date
)
SELECT * FROM ins;

-- NOTE: a LATERAL subquery that doesn't reference any outer column (like
-- "ORDER BY random() LIMIT n" against food_items with no per-meal reference)
-- is not actually correlated, so Postgres is free to materialize it once and
-- reuse it for every meal — every meal would get the exact same food items.
-- Cross-joining meals x food_items and ranking with a hash that genuinely
-- incorporates both ids forces real per-meal variation.
INSERT INTO meal_items (id, meal_id, food_item_id, quantity, serving_size_g, calories, protein_g, carbs_g, fats_g)
SELECT
    uuid_generate_v4(), picked.meal_id, picked.food_id,
    ROUND(picked.mult::numeric, 2),
    ROUND((picked.serving_size_g * picked.mult)::numeric, 1),
    ROUND((picked.calories * picked.mult)::numeric, 1),
    ROUND((picked.protein_g * picked.mult)::numeric, 2),
    ROUND((picked.carbs_g * picked.mult)::numeric, 2),
    ROUND((picked.fats_g * picked.mult)::numeric, 2)
FROM (
    SELECT
        dm.id AS meal_id, fi.id AS food_id, fi.serving_size_g, fi.calories, fi.protein_g, fi.carbs_g, fi.fats_g,
        0.7 + random() * 1.0 AS mult,
        ROW_NUMBER() OVER (PARTITION BY dm.id ORDER BY md5(dm.id::text || fi.id::text)) AS rn,
        1 + (('x' || substr(md5(dm.id::text || 'n'), 1, 8))::bit(32)::int % 2) AS item_count
    FROM demo_meals dm
    CROSS JOIN food_items fi
) picked
WHERE picked.rn <= picked.item_count;

-- ── Workout plan: Push / Pull / Legs ────────────────────────────────────────

CREATE TEMP TABLE demo_plan AS
WITH ins AS (
    INSERT INTO workout_plans (id, user_id, name, description, is_active)
    SELECT uuid_generate_v4(), user_id, 'Push Pull Legs', 'Classic 3-day PPL split for balanced hypertrophy.', TRUE
    FROM demo_user
    RETURNING id
)
SELECT id AS plan_id FROM ins;

CREATE TEMP TABLE demo_days AS
WITH day_defs(name, dow, sort_order, day_type) AS (
    VALUES
        ('Push Day', 'MONDAY'::day_of_week,    0, 'PUSH'),
        ('Pull Day', 'WEDNESDAY'::day_of_week, 1, 'PULL'),
        ('Leg Day',  'FRIDAY'::day_of_week,    2, 'LEGS')
),
ins AS (
    INSERT INTO workout_days (id, plan_id, name, day_of_week, sort_order)
    SELECT uuid_generate_v4(), dp.plan_id, d.name, d.dow, d.sort_order
    FROM day_defs d CROSS JOIN demo_plan dp
    RETURNING id, plan_id, name
)
SELECT ins.id AS day_id, ins.name AS day_name,
       CASE ins.name WHEN 'Push Day' THEN 'PUSH' WHEN 'Pull Day' THEN 'PULL' ELSE 'LEGS' END AS day_type
FROM ins;

CREATE TEMP TABLE demo_day_exercises AS
WITH ex_defs(day_type, exercise_name, sort_order, target_sets, reps_min, reps_max, rest_seconds) AS (
    VALUES
        ('PUSH', 'Barbell Bench Press',      0, 4, 6,  10, 120),
        ('PUSH', 'Incline Dumbbell Press',   1, 3, 8,  12, 90),
        ('PUSH', 'Overhead Press',           2, 3, 6,  10, 90),
        ('PUSH', 'Dumbbell Lateral Raise',   3, 3, 12, 15, 60),
        ('PUSH', 'Tricep Pushdown',          4, 3, 10, 15, 60),
        ('PULL', 'Pull-Up',                  0, 4, 6,  10, 120),
        ('PULL', 'Bent-Over Barbell Row',    1, 4, 6,  10, 90),
        ('PULL', 'Lat Pulldown',             2, 3, 8,  12, 90),
        ('PULL', 'Seated Cable Row',         3, 3, 10, 12, 60),
        ('PULL', 'Barbell Curl',             4, 3, 10, 12, 60),
        ('LEGS', 'Back Squat',               0, 4, 6,  10, 150),
        ('LEGS', 'Romanian Deadlift',        1, 3, 8,  10, 120),
        ('LEGS', 'Leg Press',                2, 3, 10, 12, 90),
        ('LEGS', 'Leg Curl',                 3, 3, 10, 12, 60),
        ('LEGS', 'Calf Raise',               4, 4, 12, 15, 45)
),
ins AS (
    INSERT INTO workout_day_exercises (id, day_id, exercise_id, sort_order, target_sets, target_reps_min, target_reps_max, rest_seconds)
    SELECT uuid_generate_v4(), dd.day_id, e.id, x.sort_order, x.target_sets, x.reps_min, x.reps_max, x.rest_seconds
    FROM ex_defs x
    JOIN demo_days dd ON dd.day_type = x.day_type
    JOIN exercises e ON e.name = x.exercise_name
    RETURNING day_id, exercise_id, sort_order
)
SELECT * FROM ins;

-- ── Sessions — ~20 completed workouts over the last 45 days, PPL rotation ───

CREATE TEMP TABLE demo_sessions AS
WITH occurrences AS (
    SELECT idx,
           (CURRENT_DATE - ROUND(1 + idx * 43.0 / 19)::int) AS session_date,
           (ARRAY['PUSH', 'PULL', 'LEGS'])[(idx % 3) + 1] AS day_type
    FROM generate_series(0, 19) AS idx
),
ins AS (
    INSERT INTO workout_sessions (id, user_id, plan_id, day_id, name, status, started_at, completed_at, duration_seconds, is_synced)
    SELECT
        uuid_generate_v4(), du.user_id, dp.plan_id, dd.day_id, dd.day_name, 'COMPLETED',
        (o.session_date::timestamp + time '18:00:00') AT TIME ZONE 'UTC',
        (o.session_date::timestamp + time '19:05:00') AT TIME ZONE 'UTC',
        (3300 + random() * 900)::int, TRUE
    FROM occurrences o
    CROSS JOIN demo_user du
    CROSS JOIN demo_plan dp
    JOIN demo_days dd ON dd.day_type = o.day_type
    RETURNING id, day_id
)
SELECT * FROM ins;

CREATE TEMP TABLE demo_session_exercises AS
WITH ins AS (
    INSERT INTO session_exercises (id, session_id, exercise_id, sort_order)
    SELECT uuid_generate_v4(), ds.id, dde.exercise_id, dde.sort_order
    FROM demo_sessions ds
    JOIN demo_day_exercises dde ON dde.day_id = ds.day_id
    RETURNING id, session_id, exercise_id
)
SELECT * FROM ins;

-- Progressive-overload sets: weight climbs slightly each successive occurrence
-- of the same exercise, with small session-to-session jitter.
INSERT INTO workout_sets (id, session_exercise_id, set_number, set_type, weight_kg, reps, rpe, rest_seconds, is_completed, completed_at)
SELECT
    uuid_generate_v4(), spe.session_exercise_id, gs.set_num, 'NORMAL',
    GREATEST(0, ROUND((spe.base_kg + spe.weekly_increment * (spe.occurrence_idx - 1) + (random() * 4 - 2))::numeric, 1)),
    (6 + floor(random() * 6))::int,
    ROUND((6.5 + random() * 2.5)::numeric, 1),
    90, TRUE,
    spe.started_at + (gs.set_num * interval '3 minutes')
FROM (
    SELECT
        dse.id AS session_exercise_id,
        e.name AS exercise_name,
        bw.base_kg, bw.weekly_increment,
        ws.started_at,
        ROW_NUMBER() OVER (PARTITION BY dse.exercise_id ORDER BY ws.started_at) AS occurrence_idx
    FROM demo_session_exercises dse
    JOIN workout_sessions ws ON ws.id = dse.session_id
    JOIN exercises e ON e.id = dse.exercise_id
    JOIN (VALUES
        ('Barbell Bench Press',    60, 1.25),
        ('Incline Dumbbell Press', 20, 0.5),
        ('Overhead Press',         40, 0.5),
        ('Dumbbell Lateral Raise', 8,  0.25),
        ('Tricep Pushdown',        25, 0.5),
        ('Pull-Up',                0,  0.2),
        ('Bent-Over Barbell Row',  55, 1.0),
        ('Lat Pulldown',           45, 0.5),
        ('Seated Cable Row',       50, 0.5),
        ('Barbell Curl',           30, 0.5),
        ('Back Squat',             70, 1.25),
        ('Romanian Deadlift',      60, 1.0),
        ('Leg Press',              100,2.5),
        ('Leg Curl',               35, 0.5),
        ('Calf Raise',             40, 0.5)
    ) AS bw(exercise_name, base_kg, weekly_increment) ON bw.exercise_name = e.name
) spe
CROSS JOIN LATERAL generate_series(1, 3) AS gs(set_num);

UPDATE workout_sessions ws
SET total_volume_kg = sub.total_volume
FROM (
    SELECT dse.session_id, SUM(COALESCE(wset.weight_kg, 0) * COALESCE(wset.reps, 0)) AS total_volume
    FROM workout_sets wset
    JOIN demo_session_exercises dse ON dse.id = wset.session_exercise_id
    GROUP BY dse.session_id
) sub
WHERE ws.id = sub.session_id;

-- One PR per exercise — the best set by estimated 1RM (Epley formula)
INSERT INTO personal_records (id, user_id, exercise_id, session_id, weight_kg, reps, estimated_1rm, achieved_at)
SELECT DISTINCT ON (dse.exercise_id)
    uuid_generate_v4(), du.user_id, dse.exercise_id, dse.session_id,
    wset.weight_kg, wset.reps,
    ROUND((wset.weight_kg * (1 + wset.reps / 30.0))::numeric, 1),
    wset.completed_at
FROM workout_sets wset
JOIN demo_session_exercises dse ON dse.id = wset.session_exercise_id
CROSS JOIN demo_user du
WHERE wset.weight_kg IS NOT NULL
ORDER BY dse.exercise_id, (wset.weight_kg * (1 + wset.reps / 30.0)) DESC;

-- ── Recovery — daily check-ins for 21 days, computed scores for the past 20 ─
-- (today is deliberately left unscored so the app computes it live on first
-- open, using the seeded sleep/steps/water/check-in signal for today.)

INSERT INTO recovery_check_ins (id, user_id, check_in_date, energy_level, soreness_level, stress_level, mood_level, motivation_level)
SELECT
    uuid_generate_v4(), du.user_id, CURRENT_DATE - g.day_offset,
    (2 + floor(random() * 4))::int, (1 + floor(random() * 4))::int, (1 + floor(random() * 4))::int,
    (2 + floor(random() * 4))::int, (2 + floor(random() * 4))::int
FROM generate_series(0, 20) AS g(day_offset)
CROSS JOIN demo_user du;

WITH scored AS (
    SELECT
        g.day_offset, CURRENT_DATE - g.day_offset AS score_date,
        (55 + floor(random() * 40))::int AS sleep_score,
        (50 + floor(random() * 45))::int AS training_load_score,
        (55 + floor(random() * 40))::int AS heart_recovery_score,
        (60 + floor(random() * 35))::int AS hydration_score,
        (55 + floor(random() * 40))::int AS subjective_wellness_score
    FROM generate_series(1, 20) AS g(day_offset)
),
final AS (
    SELECT *,
        ROUND(sleep_score * 0.35 + training_load_score * 0.25 + heart_recovery_score * 0.20
              + hydration_score * 0.10 + subjective_wellness_score * 0.10)::int AS final_score
    FROM scored
)
INSERT INTO recovery_scores (
    id, user_id, score_date, final_score, recovery_level, confidence,
    sleep_score, training_load_score, heart_recovery_score, hydration_score, subjective_wellness_score,
    components, explanation, missing_data
)
SELECT
    uuid_generate_v4(), du.user_id, f.score_date, f.final_score,
    CASE
        WHEN f.final_score >= 85 THEN 'READY_FOR_HEAVY_TRAINING'
        WHEN f.final_score >= 70 THEN 'READY_FOR_NORMAL_TRAINING'
        WHEN f.final_score >= 55 THEN 'MODERATE_TRAINING_RECOMMENDED'
        WHEN f.final_score >= 40 THEN 'LIGHT_ACTIVITY_RECOMMENDED'
        ELSE 'REST_RECOMMENDED'
    END,
    0.85,
    f.sleep_score, f.training_load_score, f.heart_recovery_score, f.hydration_score, f.subjective_wellness_score,
    jsonb_build_object(
        'sleep',              jsonb_build_object('score', f.sleep_score, 'status', 'GOOD', 'explanation', 'Based on seeded sleep data.', 'confidence', 0.9),
        'trainingLoad',       jsonb_build_object('score', f.training_load_score, 'status', 'MODERATE', 'explanation', 'Based on recent training volume.', 'confidence', 0.85),
        'heartRecovery',      jsonb_build_object('score', f.heart_recovery_score, 'status', 'GOOD', 'explanation', 'Estimated recovery trend.', 'confidence', 0.7),
        'hydration',          jsonb_build_object('score', f.hydration_score, 'status', 'GOOD', 'explanation', 'Based on logged water intake.', 'confidence', 0.9),
        'subjectiveWellness', jsonb_build_object('score', f.subjective_wellness_score, 'status', 'GOOD', 'explanation', 'Based on daily check-in.', 'confidence', 0.95)
    ),
    'Demo recovery score generated from seeded historical data.',
    '[]'::jsonb
FROM final f
CROSS JOIN demo_user du;
