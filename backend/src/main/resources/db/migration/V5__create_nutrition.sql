CREATE TYPE meal_type AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT');

-- Food items database
CREATE TABLE food_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(300) NOT NULL,
    brand           VARCHAR(200),
    barcode         VARCHAR(50),
    serving_size_g  NUMERIC(7,2) NOT NULL DEFAULT 100,
    serving_unit    VARCHAR(50) DEFAULT 'g',
    -- Per serving nutrition
    calories        NUMERIC(7,1) NOT NULL,
    protein_g       NUMERIC(7,2) NOT NULL DEFAULT 0,
    carbs_g         NUMERIC(7,2) NOT NULL DEFAULT 0,
    fats_g          NUMERIC(7,2) NOT NULL DEFAULT 0,
    fiber_g         NUMERIC(7,2),
    sugar_g         NUMERIC(7,2),
    sodium_mg       NUMERIC(7,2),
    is_custom       BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Daily meal diary
CREATE TABLE meals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type       meal_type NOT NULL,
    logged_date     DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Items within a meal
CREATE TABLE meal_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id         UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_item_id    UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
    quantity        NUMERIC(7,2) NOT NULL DEFAULT 1,
    serving_size_g  NUMERIC(7,2) NOT NULL, -- actual grams consumed
    -- Calculated at log time
    calories        NUMERIC(7,1) NOT NULL,
    protein_g       NUMERIC(7,2) NOT NULL,
    carbs_g         NUMERIC(7,2) NOT NULL,
    fats_g          NUMERIC(7,2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Saved meal templates (premium)
CREATE TABLE meal_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    meal_type       meal_type,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE meal_template_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id         UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
    food_item_id        UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
    serving_size_g      NUMERIC(7,2) NOT NULL
);

-- Indexes
CREATE INDEX idx_food_items_barcode ON food_items(barcode);
CREATE INDEX idx_food_items_name ON food_items(name);
CREATE INDEX idx_food_items_created_by ON food_items(created_by);
CREATE INDEX idx_meals_user_date ON meals(user_id, logged_date);
CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);
