ALTER TABLE users ADD COLUMN blocked_at DATETIME;
ALTER TABLE users ADD COLUMN blocked_by TEXT;
CREATE INDEX IF NOT EXISTS idx_users_blocked_at ON users(blocked_at);
CREATE INDEX IF NOT EXISTS idx_users_blocked_by ON users(blocked_by);