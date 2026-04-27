const express = require('express');
const authRoutes = require('./auth.routes');
const dbRoutes = require('./db.routes');
const facilityRoutes = require('./facility.routes');
const bookingRoutes = require('./booking.routes');
const equipmentReportRoutes = require('./equipment-report.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/db', dbRoutes);
router.use('/facilities', facilityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/equipment-reports', equipmentReportRoutes);

module.exports = router;