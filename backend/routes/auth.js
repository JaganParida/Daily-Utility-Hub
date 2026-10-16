const express = require('express');
const router = express.Router();
const {
  sendRegisterOtp,
  verifyRegisterOtpAndCreateUser,
  loginWithPassword,
  googleAuth,
  syncSession,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  logoutSession,
  recordAnalyticsVisit,
  updateAnalyticsPin,
  updateAnalyticsFavorite,
  sendOtp,
  verifyOtp,
  checkEmail,
  checkEmailAvailability
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  updateProfileValidation,
  deleteSessionValidation,
  analyticsValidation
} = require('../middleware/validationRules');
const {
  authRateLimiter,
  userRateLimiter
} = require('../middleware/rateLimitMiddleware');

// 1. Pure Nodemailer Registration Flow (OTP first, DB account created only after OTP verified)
router.post('/register/send-otp', userRateLimiter, sendRegisterOtp);
router.post('/register/verify', userRateLimiter, verifyRegisterOtpAndCreateUser);

// 2. Direct MongoDB Email + Password Login
router.post('/login', authRateLimiter, loginWithPassword);

// 3. Google OAuth 2.0 / Google Identity Services Sign In
router.post('/google', authRateLimiter, googleAuth);

// 4. Legacy session sync route (backward compatibility)
router.post('/session', authRateLimiter, syncSession);

// 5. User & Session Management
router.get('/logout', logoutUser);
router.get('/profile', protect, userRateLimiter, getUserProfile);
router.put('/profile', protect, userRateLimiter, updateProfileValidation, validate, updateUserProfile);
router.delete('/sessions/:sessionId', protect, userRateLimiter, deleteSessionValidation, validate, logoutSession);

// 6. Analytics & Tool Customizations (Bookmarks & Pins)
router.post('/analytics/visit', protect, userRateLimiter, analyticsValidation, validate, recordAnalyticsVisit);
router.post('/analytics/pin', protect, userRateLimiter, analyticsValidation, validate, updateAnalyticsPin);
router.post('/analytics/favorite', protect, userRateLimiter, analyticsValidation, validate, updateAnalyticsFavorite);

// 7. Utilities & Availability Checks
router.post('/otp/send', userRateLimiter, sendOtp);
router.post('/otp/verify', userRateLimiter, verifyOtp);
router.post('/check-email', userRateLimiter, checkEmail);
router.post('/check-email-availability', userRateLimiter, checkEmailAvailability);

module.exports = router;
