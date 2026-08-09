ALTER TABLE password_reset_tokens ADD COLUMN attempts INT NOT NULL DEFAULT 0;
