const mysql = require("mysql2/promise");
const { DB_NAME, baseDbConfig, poolDbConfig } = require("./env");

let dbPool;

async function getDbPool() {
  if (dbPool) {
    return dbPool;
  }

  const setupConnection = await mysql.createConnection(baseDbConfig);

  await setupConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci`
  );
  await setupConnection.end();

  dbPool = mysql.createPool({
    ...poolDbConfig,
    database: DB_NAME,
  });

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      birth_date DATE NULL,
      student_id VARCHAR(12) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureUsersEmailColumn(dbPool);
  await ensureUsersBirthDateColumn(dbPool);
  await dbPool.query(`
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
    )
  `);
  await dbPool.query(`
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
    )
  `);

  return dbPool;
}

async function ensureUsersEmailColumn(pool) {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'`,
    [DB_NAME]
  );

  if (columns.length > 0) {
    return;
  }

  await pool.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER name");
  await pool.query("UPDATE users SET email = CONCAT(student_id, '@local.invalid') WHERE email IS NULL");
  await pool.query("ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL");
  await pool.query("CREATE UNIQUE INDEX users_email_unique ON users (email)");
}

async function ensureUsersBirthDateColumn(pool) {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date'`,
    [DB_NAME]
  );

  if (columns.length > 0) {
    return;
  }

  await pool.query("ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER email");
}

module.exports = {
  getDbPool,
};
