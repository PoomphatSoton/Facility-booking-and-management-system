const express = require('express');
const authRoutes = require('./auth.routes');
const dbRoutes = require('./db.routes');
const facilityRoutes = require('./facility.routes');
const equipmentReportRoutes = require('./equipment-report.routes');
const partnerMatchingRoutes = require('./partner-matching.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/db', dbRoutes);
router.use('/facilities', facilityRoutes);
router.use('/equipment-reports', equipmentReportRoutes);
router.use('/partner-matching', partnerMatchingRoutes);

module.exports = router;