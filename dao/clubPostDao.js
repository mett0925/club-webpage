const { CLUB_NAMES } = require("../config/env");
const { getDbPool } = require("../config/database");

function getClubEnvKey(clubName) {
  return `CLUB_OWNER_${clubName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function getClubOwnerStudentId(clubName) {
  return process.env[getClubEnvKey(clubName)] || process.env.DEFAULT_CLUB_OWNER_STUDENT_ID || "";
}

async function createClubPost(post) {
  const pool = await getDbPool();

  await pool.execute(
    `INSERT INTO club_posts (
      id,
      owner_user_id,
      owner_student_id,
      club_name,
      category,
      description,
      target_text,
      activity_time,
      activity_days,
      capacity,
      deadline_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.ownerUserId,
      post.ownerStudentId,
      post.clubName,
      post.category,
      post.description,
      post.targetText,
      post.activityTime,
      post.activityDays,
      post.capacity,
      post.deadlineDate,
    ]
  );
}

async function getClubPosts() {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      owner_student_id AS ownerStudentId,
      club_name AS clubName,
      category,
      description,
      target_text AS targetText,
      activity_time AS activityTime,
      activity_days AS activityDays,
      capacity,
      deadline_date AS deadlineDate,
      created_at AS createdAt
    FROM club_posts
    ORDER BY created_at DESC`
  );

  return rows;
}

async function getClubPostById(id) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      owner_student_id AS ownerStudentId,
      club_name AS clubName,
      category,
      description,
      target_text AS targetText,
      activity_time AS activityTime,
      activity_days AS activityDays,
      capacity,
      deadline_date AS deadlineDate,
      created_at AS createdAt
    FROM club_posts
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function updateClubPost(postId, ownerUserId, ownerStudentId, post) {
  const pool = await getDbPool();
  const [result] = await pool.execute(
    `UPDATE club_posts
    SET
      club_name = ?,
      category = ?,
      description = ?,
      target_text = ?,
      activity_time = ?,
      activity_days = ?,
      capacity = ?,
      deadline_date = ?
    WHERE id = ? AND (owner_user_id = ? OR owner_student_id = ?)`,
    [
      post.clubName,
      post.category,
      post.description,
      post.targetText,
      post.activityTime,
      post.activityDays,
      post.capacity,
      post.deadlineDate,
      postId,
      ownerUserId,
      ownerStudentId,
    ]
  );

  return result.affectedRows > 0;
}

async function deleteClubPost(postId, ownerUserId, ownerStudentId) {
  const pool = await getDbPool();
  const [result] = await pool.execute(
    `DELETE FROM club_posts
    WHERE id = ? AND (owner_user_id = ? OR owner_student_id = ?)`,
    [postId, ownerUserId, ownerStudentId]
  );

  return result.affectedRows > 0;
}

async function getClubPostsByOwner(userId, studentId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      owner_student_id AS ownerStudentId,
      club_name AS clubName,
      category,
      description,
      target_text AS targetText,
      activity_time AS activityTime,
      activity_days AS activityDays,
      capacity,
      deadline_date AS deadlineDate,
      created_at AS createdAt
    FROM club_posts
    WHERE owner_user_id = ? OR owner_student_id = ?
    ORDER BY created_at DESC`,
    [userId, studentId]
  );

  return rows;
}

async function getManagedClubNames(user) {
  const envManagedClubNames = CLUB_NAMES.filter((clubName) => getClubOwnerStudentId(clubName) === user.studentId);
  const ownedPosts = await getClubPostsByOwner(user.id, user.studentId);
  const postClubNames = ownedPosts.map((post) => post.clubName);

  return [...new Set([...envManagedClubNames, ...postClubNames])];
}

async function getAvailableClubNames() {
  const clubPosts = await getClubPosts();
  const dynamicClubNames = clubPosts.map((post) => post.clubName);

  return [...new Set(dynamicClubNames)];
}

module.exports = {
  createClubPost,
  getClubPosts,
  getClubPostById,
  updateClubPost,
  deleteClubPost,
  getClubPostsByOwner,
  getManagedClubNames,
  getAvailableClubNames,
};
