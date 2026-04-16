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

// Staff view all pending requests for the facilities they are responsible for
router.get(
    '/staff/pending',
    requireAuth,
    requireRole(['staff']),
    bookingController.getPendingRequests
);

module.exports = router;