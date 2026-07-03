const express = require('express');
const router = express.Router();
const {
  syncSession,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  logoutSession,
  recordAnalyticsVisit,
  updateAnalyticsPin
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Unified session sync route (verifies Firebase token, registers device session, sets cookie)
router.post('/session', syncSession);

router.get('/logout', protect, logoutUser);

router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile);

router.delete('/sessions/:sessionId', protect, logoutSession);

router.post('/analytics/visit', protect, recordAnalyticsVisit);

router.post('/analytics/pin', protect, updateAnalyticsPin);

module.exports = router;
