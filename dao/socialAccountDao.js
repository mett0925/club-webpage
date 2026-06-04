const { getDbPool } = require("../config/database");

async function findSocialAccount(provider, providerUserId) {
  const pool = await getDbPool();
  const [rows] = await pool.execute(
    `SELECT
      id,
      user_id AS userId,
      provider,
      provider_user_id AS providerUserId,
      created_at AS createdAt
    FROM user_social_accounts
    WHERE provider = ? AND provider_user_id = ?
    LIMIT 1`,
    [provider, providerUserId]
  );

  return rows[0] || null;
}

async function createSocialAccount({ id, userId, provider, providerUserId }) {
  const pool = await getDbPool();

  await pool.execute(
    `INSERT INTO user_social_accounts (id, user_id, provider, provider_user_id)
    VALUES (?, ?, ?, ?)`,
    [id, userId, provider, providerUserId]
  );
}

async function linkSocialAccount(userId, provider, providerUserId) {
  const existing = await findSocialAccount(provider, providerUserId);

  if (existing) {
    return existing;
  }

  const crypto = require("crypto");
  await createSocialAccount({
    id: crypto.randomUUID(),
    userId,
    provider,
    providerUserId,
  });

  return findSocialAccount(provider, providerUserId);
}

module.exports = {
  findSocialAccount,
  createSocialAccount,
  linkSocialAccount,
};
