const crypto = require("crypto");
const { getDbPool } = require("../config/database");
const { hashPassword } = require("../services/passwordService");

async function findUserById(userId) {
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
    WHERE id = ?
    LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

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

async function generateUniqueSocialStudentId(provider, providerUserId) {
  const prefixMap = {
    google: "G",
    kakao: "K",
    naver: "N",
  };
  const prefix = prefixMap[provider] || "S";
  const hash = crypto.createHash("sha256").update(`${provider}:${providerUserId}`).digest("hex");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${prefix}${hash.slice(attempt * 10, attempt * 10 + 11)}`;
    const exists = await findUserByStudentId(candidate);

    if (!exists) {
      return candidate;
    }
  }

  return `${prefix}${Date.now().toString().slice(-11)}`;
}

async function createSocialUser({ name, email, provider, providerUserId }) {
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    birthDate: null,
    studentId: await generateUniqueSocialStudentId(provider, providerUserId),
    passwordHash: null,
    createdAt: new Date().toISOString(),
  };

  await createUser(user);
  return user;
}

module.exports = {
  findUserById,
  findUserByStudentId,
  findUserByEmail,
  updateUserProfile,
  createUser,
  createSocialUser,
};
