const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLoginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  logoutSession,
  recordAnalyticsVisit,
  updateAnalyticsPin
} = require('../controllers/authController');
const { protect, softProtect } = require('../middleware/authMiddleware');

const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists(),
  ],
  validate,
  loginUser
);

router.post('/google', googleLoginUser);

router.get('/logout', protect, logoutUser);

router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile);

router.delete('/sessions/:sessionId', protect, logoutSession);

router.post('/analytics/visit', protect, recordAnalyticsVisit);

router.post('/analytics/pin', protect, updateAnalyticsPin);

module.exports = router;
