const express = require('express');
const authRoutes = require('./auth.routes');
const dbRoutes = require('./db.routes');
const facilityRoutes = require('./facility.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/db', dbRoutes);
router.use('/facilities', facilityRoutes);

module.exports = router;
