const express = require('express');
const facilityController = require('../controllers/facility.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/cards', requireAuth, facilityController.getFacilityCards);
router.put('/:facilityId', facilityController.updateFacility);
router.delete('/:facilityId', facilityController.deleteFacility);

module.exports = router;
