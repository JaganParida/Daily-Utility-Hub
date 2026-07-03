const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper to parse User-Agent header into a friendly device name
const getDeviceName = (userAgentString) => {
  const ua = userAgentString || '';
  if (/like Mac OS X/.test(ua) && /Mobile/.test(ua)) return 'iPhone/iOS Mobile';
  if (/Android/.test(ua)) return 'Android Mobile';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Macintosh/.test(ua)) return 'macOS PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Web Browser';
};

// Generate JWT, register session with User-Agent, enforce 2-device limit, set httpOnly cookie
const sendTokenResponse = async (user, userAgent, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const deviceName = getDeviceName(userAgent);

  // Add session metadata
  user.activeSessions.push({
    token,
    deviceName,
    lastActive: new Date()
  });

  // Strict 2-device session limit (FIFO: First-In, First-Out)
  if (user.activeSessions.length > 2) {
    user.activeSessions = user.activeSessions.slice(user.activeSessions.length - 2);
  }

  await user.save();

  // Configure cookie options
  const isProd = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true, // Safeguards against XSS extraction
    secure: isProd, // Production HTTPS only
    sameSite: isProd ? 'none' : 'lax' // Cross-domain cookie support in prod
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    await sendTokenResponse(user, req.headers['user-agent'], 201, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.matchPassword(password))) {
      await sendTokenResponse(user, req.headers['user-agent'], 200, res);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Google token & authenticate user
// @route   POST /api/auth/google
// @access  Public
exports.googleLoginUser = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token required.' });
    }

    // Call Google's token verification API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return res.status(401).json({ message: 'Google authentication failed.' });
    }

    const payload = await response.json();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      // Create account with randomized credentials for Google users
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword
      });
    }

    await sendTokenResponse(user, req.headers['user-agent'], 200, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear session in database & cookie
// @route   GET /api/auth/logout
// @access  Private (protect)
exports.logoutUser = async (req, res) => {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (token && req.user) {
      // Remove this specific session token from user list
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { activeSessions: { token } }
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.status(200).json({ success: true, message: 'User logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile, sessions, history, and bookmarks
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json(null);
    }
    
    // Return profile & clean sessions metadata (strip secret tokens)
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      pinnedTools: req.user.pinnedTools || [],
      recentHistory: req.user.recentHistory || [],
      activeSessions: req.user.activeSessions.map(s => ({
        _id: s._id,
        deviceName: s.deviceName,
        lastActive: s.lastActive,
        isCurrent: s.token === req.token
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile name / password
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, password } = req.body;
    if (name) user.name = name;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password;
    }

    await user.save();
    res.json({ success: true, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke specific device session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
exports.logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out the requested session
    user.activeSessions = user.activeSessions.filter(s => s._id.toString() !== sessionId);
    await user.save();

    res.json({ success: true, message: 'Device logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record visited tool in database history (max 20 items)
// @route   POST /api/auth/analytics/visit
// @access  Private
exports.recordAnalyticsVisit = async (req, res) => {
  try {
    const { toolPath } = req.body;
    if (!toolPath) {
      return res.status(400).json({ message: 'Tool path required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Reorder history so that latest visit goes to the top
    user.recentHistory = user.recentHistory.filter(h => h.toolPath !== toolPath);
    user.recentHistory.unshift({ toolPath, visitedAt: new Date() });

    // Strict free-tier limits: cap history list at 20 items to prevent MongoDB storage bloat
    if (user.recentHistory.length > 20) {
      user.recentHistory = user.recentHistory.slice(0, 20);
    }

    await user.save();
    res.json({ success: true, recentHistory: user.recentHistory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle a pinned tool in database bookmarks (max 12 items)
// @route   POST /api/auth/analytics/pin
// @access  Private
exports.updateAnalyticsPin = async (req, res) => {
  try {
    const { toolPath } = req.body;
    if (!toolPath) {
      return res.status(400).json({ message: 'Tool path required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPinned = user.pinnedTools.includes(toolPath);
    if (isPinned) {
      user.pinnedTools = user.pinnedTools.filter(p => p !== toolPath);
    } else {
      // Strict free-tier limits: cap pinned tools at 12 items
      if (user.pinnedTools.length >= 12) {
        return res.status(400).json({ message: 'Bookmark limit reached (maximum 12).' });
      }
      user.pinnedTools.push(toolPath);
    }

    await user.save();
    res.json({ success: true, pinnedTools: user.pinnedTools });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
