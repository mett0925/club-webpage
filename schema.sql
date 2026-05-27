CREATE DATABASE IF NOT EXISTS club_web_page
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE club_web_page;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(12) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY,
  club_name VARCHAR(100) NOT NULL,
  applicant_user_id CHAR(36) NOT NULL,
  applicant_name VARCHAR(50) NOT NULL,
  applicant_student_id VARCHAR(12) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  motivation TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX applications_club_name_idx (club_name),
  INDEX applications_applicant_user_id_idx (applicant_user_id)
);

CREATE TABLE IF NOT EXISTS club_posts (
  id CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36) NOT NULL,
  owner_student_id VARCHAR(12) NOT NULL,
  club_name VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  target_text VARCHAR(255) NOT NULL,
  activity_time VARCHAR(255) NOT NULL,
  activity_days VARCHAR(50) NOT NULL,
  capacity VARCHAR(50) NOT NULL,
  deadline_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX club_posts_owner_user_id_idx (owner_user_id),
  INDEX club_posts_club_name_idx (club_name)
);
