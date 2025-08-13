ALTER TABLE users ADD COLUMN temp_password_hash TEXT;
ALTER TABLE users ADD COLUMN temp_password_expires DATETIME;
ALTER TABLE users ADD COLUMN password_reset_by TEXT;
CREATE INDEX IF NOT EXISTS idx_users_temp_password_expires ON users(temp_password_expires);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_by ON users(password_reset_by);