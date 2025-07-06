const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  validateUserRegistration, 
  validateUserLogin,
  validateRefreshToken 
} = require('../middleware/validation');
const { authenticateJWT } = require('../middleware/auth');

// Registration and login
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/refresh', validateRefreshToken, authController.refreshToken);
router.post('/logout', authenticateJWT, authController.logout);

// Firebase authentication
router.post('/verify-firebase', authController.verifyFirebaseToken);
router.post('/firebase-login', authController.firebaseLogin);

// Password reset (for future implementation)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Verify email (for future implementation)
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

module.exports = router;