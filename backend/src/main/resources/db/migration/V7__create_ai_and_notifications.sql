-- AI Coach conversations
CREATE TABLE ai_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(300),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TYPE ai_message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE ai_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role                ai_message_role NOT NULL,
    content             TEXT NOT NULL,
    tokens_used         INTEGER,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AI rate limiting tracker
CREATE TABLE ai_usage_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    tokens_used     INTEGER
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    workout_reminder        BOOLEAN DEFAULT TRUE,
    workout_reminder_time   TIME DEFAULT '08:00:00',
    water_reminder          BOOLEAN DEFAULT TRUE,
    water_reminder_interval_hours INTEGER DEFAULT 2,
    meal_reminder           BOOLEAN DEFAULT TRUE,
    weigh_in_reminder       BOOLEAN DEFAULT TRUE,
    weigh_in_reminder_time  TIME DEFAULT '07:00:00',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Push notification tokens
CREATE TABLE push_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL,
    platform    platform NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_usage_logs_user_at ON ai_usage_logs(user_id, request_at);
