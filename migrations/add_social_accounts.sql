USE club_web_page;

ALTER TABLE users
  MODIFY student_id VARCHAR(30) NOT NULL,
  MODIFY password_hash VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS user_social_accounts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_social_accounts_provider_user_unique (provider, provider_user_id),
  INDEX user_social_accounts_user_id_idx (user_id)
);
