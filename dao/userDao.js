const { getDbPool } = require("../config/database");
const { hashPassword } = require("../services/passwordService");

async function findUserByStudentId(studentId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      birth_date AS birthDate,
      student_id AS studentId,
      password_hash AS passwordHash,
      created_at AS createdAt
    FROM users
    WHERE student_id = ?
    LIMIT 1`,
    [studentId]
  );

  return rows[0] || null;
}

async function findUserByEmail(email) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      birth_date AS birthDate,
      student_id AS studentId,
      password_hash AS passwordHash,
      created_at AS createdAt
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function updateUserProfile(userId, profile) {
  const pool = await getDbPool();
  const passwordHash = profile.password ? hashPassword(profile.password) : null;

  if (passwordHash) {
    await pool.execute(
      `UPDATE users
      SET name = ?, email = ?, birth_date = ?, student_id = ?, password_hash = ?
      WHERE id = ?`,
      [profile.name, profile.email, profile.birthDate, profile.studentId, passwordHash, userId]
    );
  } else {
    await pool.execute(
      `UPDATE users
      SET name = ?, email = ?, birth_date = ?, student_id = ?
      WHERE id = ?`,
      [profile.name, profile.email, profile.birthDate, profile.studentId, userId]
    );
  }

  return {
    id: userId,
    name: profile.name,
    email: profile.email,
    birthDate: profile.birthDate,
    studentId: profile.studentId,
  };
}

async function createUser(user) {
  const pool = await getDbPool();

  await pool.execute(
    "INSERT INTO users (id, name, email, birth_date, student_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
    [user.id, user.name, user.email, user.birthDate, user.studentId, user.passwordHash]
  );
}

module.exports = {
  findUserByStudentId,
  findUserByEmail,
  updateUserProfile,
  createUser,
};
