const express = require('express');
const dbController = require('../controllers/db.controller');

const router = express.Router();

router.get('/ping', dbController.pingDatabase);
router.get('/users', dbController.getUsers);

module.exports = router;
