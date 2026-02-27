const db = require("../db");

const findUsageByDateAndClient = async (dateKey, clientIdentifier) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT usage_count FROM guest_daily_usage WHERE date_key = ? AND client_identifier = ? LIMIT 1",
      [dateKey, clientIdentifier]
    );

  if (rows.length === 0) {
    return 0;
  }

  return Number(rows[0].usage_count || 0);
};

const incrementUsage = async (dateKey, clientIdentifier) => {
  await db
    .promise()
    .query(
      `INSERT INTO guest_daily_usage (date_key, client_identifier, usage_count)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`,
      [dateKey, clientIdentifier]
    );

  return findUsageByDateAndClient(dateKey, clientIdentifier);
};

module.exports = {
  findUsageByDateAndClient,
  incrementUsage
};
