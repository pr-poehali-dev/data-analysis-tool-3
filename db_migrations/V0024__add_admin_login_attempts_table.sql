CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(64) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time
    ON admin_login_attempts (ip_address, attempted_at);
