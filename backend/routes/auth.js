const express = require('express');
const router = express.Router();
const {
  syncSession,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  logoutSession,
  recordAnalyticsVisit,
  updateAnalyticsPin,
  updateAnalyticsFavorite,
  sendOtp,
  verifyOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  sessionValidation,
  updateProfileValidation,
  deleteSessionValidation,
  analyticsValidation
} = require('../middleware/validationRules');
const {
  authRateLimiter,
  userRateLimiter
} = require('../middleware/rateLimitMiddleware');

// Unified session sync route (verifies Firebase token, registers device session, sets cookie)
// Applies exponential backoff rate limiter and input validations
router.post('/session', authRateLimiter, sessionValidation, validate, syncSession);

router.get('/logout', logoutUser);

router.get('/profile', protect, userRateLimiter, getUserProfile);

router.put('/profile', protect, userRateLimiter, updateProfileValidation, validate, updateUserProfile);

router.delete('/sessions/:sessionId', protect, userRateLimiter, deleteSessionValidation, validate, logoutSession);

router.post('/analytics/visit', protect, userRateLimiter, analyticsValidation, validate, recordAnalyticsVisit);

router.post('/analytics/pin', protect, userRateLimiter, analyticsValidation, validate, updateAnalyticsPin);

router.post('/analytics/favorite', protect, userRateLimiter, analyticsValidation, validate, updateAnalyticsFavorite);

router.post('/otp/send', userRateLimiter, sendOtp);
router.post('/otp/verify', userRateLimiter, verifyOtp);

module.exports = router;
