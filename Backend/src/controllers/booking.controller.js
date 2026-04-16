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

module.exports = {
    getAvailableSlots,
    submitBookingRequest,
    getPendingRequests,
};