const express = require('express');
const facilityController = require('../controllers/facility.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/cards', requireAuth, facilityController.getFacilityCards);
router.get('/:facilityId/slot-times', requireAuth, facilityController.getFacilitySlotTimes);
router.put('/:facilityId', requireAuth, facilityController.updateFacility);
router.delete('/:facilityId', requireAuth, facilityController.deleteFacility);
router.post('/', requireAuth, facilityController.createFacility);

module.exports = router;
