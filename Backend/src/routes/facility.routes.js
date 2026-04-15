const express = require('express');
const facilityController = require('../controllers/facility.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/cards', requireAuth, facilityController.getFacilityCards);

module.exports = router;
