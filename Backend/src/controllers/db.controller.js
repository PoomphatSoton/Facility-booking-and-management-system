const dbService = require('../services/db.service');

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const pingDatabase = async (req, res) => {
  try {
    const row = await dbService.getDatabaseTime();
    return res.status(200).json({
      status: 'ok',
      databaseTime: row.now,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'database connection failed',
      detail: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await dbService.listUsers(parseLimit(req.query.limit));
    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch users',
      detail: error.message,
    });
  }
};

module.exports = {
  pingDatabase,
  getUsers,
};
