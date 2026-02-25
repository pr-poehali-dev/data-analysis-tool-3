ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

CREATE TABLE IF NOT EXISTS telegram_auth_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    telegram_id VARCHAR(50) NOT NULL,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);