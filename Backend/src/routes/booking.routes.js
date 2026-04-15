const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Members view the available time slots of a specific venue
router.get(
    '/facilities/:facilityId/slots',
    requireAuth,
    requireRole(['member']),
    bookingController.getAvailableSlots
);

// Member submits a reservation request
router.post(
    '/requests',
    requireAuth,
    requireRole(['member']),
    bookingController.submitBookingRequest
);

module.exports = router;