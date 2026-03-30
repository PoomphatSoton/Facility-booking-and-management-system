const { pool } = require('../config/db');

const getDatabaseTime = async () => {
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0];
};

const listUsers = async (limit = 20) => {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 20;

  const result = await pool.query(
    `
      SELECT
        id,
        email,
        first_name AS "firstName",
        last_name AS "lastName",
        date_of_birth AS "dateOfBirth",
        address,
        created_at AS "createdAt"
      FROM users
      ORDER BY id DESC
      LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
};

module.exports = {
  getDatabaseTime,
  listUsers,
};
