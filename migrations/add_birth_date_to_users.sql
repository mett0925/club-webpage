USE club_web_page;

ALTER TABLE users
  ADD COLUMN birth_date DATE NULL AFTER email;
