const { getDbPool } = require("../config/database");

async function createApplication(application) {
  const pool = await getDbPool();

  await pool.execute(
    `INSERT INTO applications (
      id,
      club_name,
      applicant_user_id,
      applicant_name,
      applicant_student_id,
      phone,
      motivation
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      application.id,
      application.clubName,
      application.applicantUserId,
      application.applicantName,
      application.applicantStudentId,
      application.phone,
      application.motivation,
    ]
  );
}

async function getApplicationsByClubNames(clubNames) {
  if (clubNames.length === 0) {
    return [];
  }

  const pool = await getDbPool();
  const placeholders = clubNames.map(() => "?").join(", ");
  const [rows] = await pool.execute(
    `SELECT
      id,
      club_name AS clubName,
      applicant_name AS applicantName,
      applicant_student_id AS applicantStudentId,
      phone,
      motivation,
      created_at AS createdAt
    FROM applications
    WHERE club_name IN (${placeholders})
    ORDER BY created_at DESC`,
    clubNames
  );

  return rows;
}

async function getApplicationsByUserId(userId, studentId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      club_name AS clubName,
      phone,
      motivation,
      created_at AS createdAt
    FROM applications
    WHERE applicant_user_id = ? OR applicant_student_id = ?
    ORDER BY created_at DESC`,
    [userId, studentId]
  );

  return rows;
}

async function getApplicationCount() {
  const pool = await getDbPool();
  const [rows] = await pool.execute(`SELECT COUNT(*) AS count FROM applications`);

  return Number(rows[0].count) || 0;
}

async function updateApplication(applicationId, applicantUserId, applicantStudentId, application) {
  const pool = await getDbPool();
  const [result] = await pool.execute(
    `UPDATE applications
    SET
      club_name = ?,
      phone = ?,
      motivation = ?
    WHERE id = ? AND (applicant_user_id = ? OR applicant_student_id = ?)`,
    [
      application.clubName,
      application.phone,
      application.motivation,
      applicationId,
      applicantUserId,
      applicantStudentId,
    ]
  );

  return result.affectedRows > 0;
}

async function deleteApplication(applicationId, applicantUserId, applicantStudentId) {
  const pool = await getDbPool();
  const [result] = await pool.execute(
    `DELETE FROM applications
    WHERE id = ? AND (applicant_user_id = ? OR applicant_student_id = ?)`,
    [applicationId, applicantUserId, applicantStudentId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createApplication,
  getApplicationsByClubNames,
  getApplicationsByUserId,
  getApplicationCount,
  updateApplication,
  deleteApplication,
};
