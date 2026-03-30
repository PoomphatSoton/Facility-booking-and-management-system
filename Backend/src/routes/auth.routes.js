const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register/credentials', authController.registerCredentials);
router.post('/register/otp', authController.verifyRegisterOtp);
router.post('/register/details', authMiddleware.requireAuth, authController.completeRegisterDetails);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/session', authController.sessionStatus);
router.get('/me', authMiddleware.requireAuth, authController.me);

module.exports = router;
