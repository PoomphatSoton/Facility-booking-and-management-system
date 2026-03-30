const express = require('express');
const authRoutes = require('./auth.routes');
const dbRoutes = require('./db.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/db', dbRoutes);

module.exports = router;
