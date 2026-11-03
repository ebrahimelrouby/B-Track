-- Food Database & Nutrition Search Engine — Phase 1: domain model foundation.
-- Extends the existing food_items catalog (search/diary API already works
-- against it unchanged) rather than replacing it; new tables support
-- categorization, branding, favorites, translations, and multi-provider
-- source tracking for later phases (USDA/Open Food Facts import, search,
-- admin curation). All additions are nullable/defaulted — fully backward
-- compatible with current reads.

CREATE TYPE food_verification_status AS ENUM ('UNVERIFIED', 'VERIFIED', 'REVIEW_REQUIRED', 'REJECTED');

-- Food categories (self-referencing for parent/child, e.g. "Meat" > "Poultry")
CREATE TABLE food_categories (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(150) NOT NULL,
    name_ar             VARCHAR(150),
    name_en             VARCHAR(150),
    parent_category_id  UUID REFERENCES food_categories(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Food brands (e.g. "Nestlé", "Al Marai")
CREATE TABLE food_brands (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    country     VARCHAR(100),
    website     VARCHAR(500),
    logo_url    VARCHAR(2000),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Extend the existing food catalog with categorization, provenance, and
-- verification fields. `brand` (string) and `verified` (boolean) stay as-is
-- — existing code already reads them — these are additive, richer fields
-- for the new import/search/admin pipeline to use going forward.
ALTER TABLE food_items
    ADD COLUMN category_id         UUID REFERENCES food_categories(id) ON DELETE SET NULL,
    ADD COLUMN brand_id            UUID REFERENCES food_brands(id) ON DELETE SET NULL,
    ADD COLUMN data_source         VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN external_source_id  VARCHAR(300),
    ADD COLUMN verification_status food_verification_status NOT NULL DEFAULT 'UNVERIFIED',
    ADD COLUMN country             VARCHAR(100);

-- Existing non-custom (admin/seed-entered) foods are trusted; existing
-- user-created foods stay UNVERIFIED (the column default already covers
-- this — explicit for clarity and to survive a future default change).
UPDATE food_items SET verification_status = 'VERIFIED' WHERE is_custom = FALSE;
UPDATE food_items SET verification_status = 'UNVERIFIED' WHERE is_custom = TRUE;

-- User favorite foods
CREATE TABLE user_favorite_foods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, food_item_id)
);

-- Per-locale food name/alias translations (mirrors exercise_translations)
CREATE TABLE food_translations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id    UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    language        VARCHAR(10) NOT NULL,  -- 'ar', 'en', etc.
    translated_name VARCHAR(300) NOT NULL,
    search_aliases  TEXT,                  -- comma-separated alternate spellings
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (food_item_id, language)
);

-- Provenance tracking per food, per provider — supports future duplicate
-- detection/reconciliation when the same food exists across providers.
CREATE TABLE food_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id    UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    provider        VARCHAR(100) NOT NULL,  -- 'USDA', 'OPEN_FOOD_FACTS', 'MANUAL', ...
    external_id     VARCHAR(300),
    source_url      VARCHAR(2000),
    license         VARCHAR(200),
    attribution     TEXT,
    last_synced_at  TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (food_item_id, provider)
);

-- Indexes
CREATE INDEX idx_food_items_category_id          ON food_items(category_id);
CREATE INDEX idx_food_items_brand_id             ON food_items(brand_id);
CREATE INDEX idx_food_items_verification_status  ON food_items(verification_status);
CREATE INDEX idx_food_items_external_source_id   ON food_items(external_source_id);
CREATE INDEX idx_food_categories_parent          ON food_categories(parent_category_id);
CREATE INDEX idx_user_favorite_foods_user_id     ON user_favorite_foods(user_id);
CREATE INDEX idx_food_translations_food_item_id  ON food_translations(food_item_id);
CREATE INDEX idx_food_sources_food_item_id       ON food_sources(food_item_id);
CREATE INDEX idx_food_sources_provider           ON food_sources(provider);
