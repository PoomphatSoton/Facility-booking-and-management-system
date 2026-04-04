const express = require('express');
const facilityController = require('../controllers/facility.controller');

const router = express.Router();

router.get('/cards', facilityController.getFacilityCards);

module.exports = router;
