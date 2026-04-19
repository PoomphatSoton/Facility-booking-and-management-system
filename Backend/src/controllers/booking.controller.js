const bookingService = require('../services/booking.service');

const getAvailableSlots = async (req, res) => {
    try {
        const facilityId = parseInt(req.params.facilityId, 10);

        if (isNaN(facilityId)) {
            return res.status(400).json({
                status: 'error',
                message: 'invalid facility id'
            });
        }

        const result = await bookingService.getAvailableSlots(facilityId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        if (error.message === 'FACILITY_NOT_FOUND') {
            return res.status(404).json({
                status: 'error',
                message: 'facility not found'
            });
        }
        console.error('getAvailableSlots error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'internal server error',
            detail: error.message
        });
    }
};

const submitBookingRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { facilityId, slotDate, startTime, endTime, intendedActivity } = req.body;

        if (!facilityId || !slotDate || !startTime || !endTime) {
            return res.status(400).json({
                status: 'error',
                message: 'missing required fields: facilityId, slotDate, startTime, endTime',
            });
        }

        const result = await bookingService.submitBookingRequest({
            userId,
            facilityId: parseInt(facilityId, 10),
            slotDate,
            startTime,
            endTime,
            intendedActivity,
        });

        return res.status(201).json({ status: 'ok', data: result });
    } catch (error) {
        const errorMessages = {
            MEMBER_NOT_FOUND: 'member account not found',
            FACILITY_NOT_FOUND: 'facility not found',
            SLOT_NOT_AVAILABLE: 'this slot does not exist or has passed',
            DUPLICATE_REQUEST: 'you already have a pending request for this slot',
        };

        if (errorMessages[error.message]) {
            return res.status(400).json({
                status: 'error',
                code: error.message,
                message: errorMessages[error.message],
            });
        }

        console.error('submitBookingRequest error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'internal server error',
            detail: error.message,
        });
    }
};

const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await bookingService.getPendingRequestsForStaff(userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        if (error.message === 'STAFF_NOT_FOUND') {
            return res.status(404).json({
                status: 'error',
                message: 'staff record not found for this user',
            });
        }
        console.error('getPendingRequests error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'internal server error',
            detail: error.message,
        });
    }
};

const approveRequest = async (req, res) => {
    try {
        const bookingRequestId = parseInt(req.params.requestId, 10);
        if (isNaN(bookingRequestId)) {
            return res.status(400).json({ status: 'error', message: 'invalid request id' });
        }

        const userId = req.user.id;
        const result = await bookingService.approveRequest(bookingRequestId, userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        // Conflict detection failed
        if (error.message === 'CONFLICT') {
            return res.status(409).json({
                status: 'error',
                code: 'CONFLICT',
                conflicts: error.conflicts,
                message: `Cannot approve: ${error.conflicts.join(', ')}`,
            });
        }

        const errorMap = {
            STAFF_NOT_FOUND: { status: 404, message: 'staff record not found' },
            REQUEST_NOT_FOUND: { status: 404, message: 'booking request not found' },
            REQUEST_ALREADY_PROCESSED: { status: 400, message: 'request already processed' },
            STAFF_NOT_AUTHORIZED: { status: 403, message: 'you are not authorized for this facility' },
            MEMBER_INACTIVE: { status: 400, message: 'member account is not active' },
            CAPACITY_EXCEEDED: { status: 409, message: 'time slot is full' },
        };

        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.status).json({
                status: 'error',
                code: error.message,
                message: mapped.message,
            });
        }

        console.error('approveRequest error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'internal server error',
            detail: error.message,
        });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const bookingRequestId = parseInt(req.params.requestId, 10);
        if (isNaN(bookingRequestId)) {
            return res.status(400).json({ status: 'error', message: 'invalid request id' });
        }

        const userId = req.user.id;
        const reason = req.body.reason || '';
        const result = await bookingService.rejectRequest(bookingRequestId, userId, reason);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        const errorMap = {
            STAFF_NOT_FOUND: { status: 404, message: 'staff record not found' },
            REQUEST_NOT_FOUND: { status: 404, message: 'booking request not found' },
            REQUEST_ALREADY_PROCESSED: { status: 400, message: 'request already processed' },
            STAFF_NOT_AUTHORIZED: { status: 403, message: 'you are not authorized for this facility' },
        };

        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.status).json({
                status: 'error',
                code: error.message,
                message: mapped.message,
            });
        }

        console.error('rejectRequest error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'internal server error',
            detail: error.message,
        });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await bookingService.getMyBookings(userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        if (error.message === 'MEMBER_NOT_FOUND') {
            return res.status(404).json({ status: 'error', message: 'member record not found' });
        }
        console.error('getMyBookings error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);
        if (isNaN(bookingId)) {
            return res.status(400).json({ status: 'error', message: 'invalid booking id' });
        }
        const userId = req.user.id;
        const result = await bookingService.cancelBooking(bookingId, userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        const errorMap = {
            MEMBER_NOT_FOUND: { s: 404, m: 'member record not found' },
            BOOKING_NOT_FOUND: { s: 404, m: 'booking not found' },
            NOT_YOUR_BOOKING: { s: 403, m: 'this booking does not belong to you' },
            CANNOT_CANCEL: { s: 400, m: 'only upcoming bookings can be cancelled' },
        };
        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.s).json({ status: 'error', code: error.message, message: mapped.m });
        }
        console.error('cancelBooking error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await bookingService.getNotifications(userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        console.error('getNotifications error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notifId = parseInt(req.params.notifId, 10);
        if (isNaN(notifId)) {
            return res.status(400).json({ status: 'error', message: 'invalid notification id' });
        }
        const userId = req.user.id;
        const result = await bookingService.markNotificationRead(notifId, userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        console.error('markNotificationRead error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await bookingService.markAllNotificationsRead(userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        console.error('markAllNotificationsRead error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const getUpcomingBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await bookingService.getUpcomingBookingsForStaff(userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        if (error.message === 'STAFF_NOT_FOUND') {
            return res.status(404).json({ status: 'error', message: 'staff record not found' });
        }
        console.error('getUpcomingBookings error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const completeBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);
        if (isNaN(bookingId)) {
            return res.status(400).json({ status: 'error', message: 'invalid booking id' });
        }
        const userId = req.user.id;
        const result = await bookingService.completeBooking(bookingId, userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        const errorMap = {
            STAFF_NOT_FOUND: { s: 404, m: 'staff record not found' },
            BOOKING_NOT_FOUND: { s: 404, m: 'booking not found' },
            BOOKING_NOT_UPCOMING: { s: 400, m: 'only upcoming bookings can be completed' },
            STAFF_NOT_AUTHORIZED: { s: 403, m: 'you are not authorized for this facility' },
        };
        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.s).json({ status: 'error', code: error.message, message: mapped.m });
        }
        console.error('completeBooking error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

const cancelPendingRequest = async (req, res) => {
    try {
        const bookingRequestId = parseInt(req.params.requestId, 10);
        if (isNaN(bookingRequestId)) {
            return res.status(400).json({ status: 'error', message: 'invalid request id' });
        }
        const userId = req.user.id;
        const result = await bookingService.cancelPendingRequest(bookingRequestId, userId);
        return res.status(200).json({ status: 'ok', data: result });
    } catch (error) {
        const errorMap = {
            MEMBER_NOT_FOUND: { s: 404, m: 'member record not found' },
            REQUEST_NOT_FOUND: { s: 404, m: 'request not found' },
            NOT_YOUR_REQUEST: { s: 403, m: 'this request does not belong to you' },
            REQUEST_NOT_PENDING: { s: 400, m: 'only pending requests can be cancelled' },
        };
        const mapped = errorMap[error.message];
        if (mapped) {
            return res.status(mapped.s).json({ status: 'error', code: error.message, message: mapped.m });
        }
        console.error('cancelPendingRequest error:', error);
        return res.status(500).json({ status: 'error', message: 'internal server error' });
    }
};

module.exports = {
    getAvailableSlots,
    submitBookingRequest,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    getMyBookings,
    cancelBooking,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUpcomingBookings,
    completeBooking,
    cancelPendingRequest,
};