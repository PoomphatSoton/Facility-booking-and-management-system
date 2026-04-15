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

module.exports = {
    getAvailableSlots,
};