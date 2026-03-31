const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register/credentials', authController.registerCredentials);
router.post('/register/otp', authController.verifyRegisterOtp);
router.post('/register/resend-otp', authController.resendOtp);
router.post('/register/details', authMiddleware.requireAuth, authController.completeRegisterDetails);
router.post('/forgot-password/request', authController.forgotPasswordRequest);
router.post('/forgot-password/verify', authController.forgotPasswordVerify);
router.post('/forgot-password/reset', authController.forgotPasswordReset);
router.post('/forgot-password/resend-otp', authController.forgotPasswordResendOtp);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/session', authController.sessionStatus);
router.get('/me', authMiddleware.requireAuth, authController.me);
router.get('/test-send-otp', authController.testSendOtp);

module.exports = router;
