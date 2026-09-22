-- Up Migration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_password_token_expires TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);

-- Down Migration
DROP INDEX IF EXISTS idx_users_reset_password_token;
ALTER TABLE users 
DROP COLUMN IF EXISTS reset_password_token,
DROP COLUMN IF EXISTS reset_password_token_expires;
