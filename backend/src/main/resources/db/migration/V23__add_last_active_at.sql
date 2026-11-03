ALTER TABLE users ADD COLUMN last_active_at TIMESTAMPTZ;

CREATE INDEX idx_users_last_active_at ON users(last_active_at);
