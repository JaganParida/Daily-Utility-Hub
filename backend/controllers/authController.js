const User = require('../models/User');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const crypto = require('crypto');

// Setup Google Firebase JWKS signing key client
const jwksClient = jwksRsa({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  cache: true,
  rateLimit: true
});

function getKey(header, callback) {
  jwksClient.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey() || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Verification helper for Firebase RS256 JWT ID tokens
const verifyFirebaseToken = (idToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(idToken, getKey, {
      issuer: 'https://securetoken.google.com/daily-utility-hub',
      audience: 'daily-utility-hub',
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

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

// @desc    Verify Firebase ID token, sync user record in MongoDB, enforce 2-device session limit
// @route   POST /api/auth/session
// @access  Public
exports.syncSession = async (req, res) => {
  try {
    const { idToken, mode, name: registerName } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Authentication token required.' });
    }

    let decoded;
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      if (req.logAuthAttempt) await req.logAuthAttempt(false);
      return res.status(401).json({ message: 'Invalid or expired credentials.' });
    }

    const { email, name } = decoded;

    // 2. Query MongoDB by email
    let user = await User.findOne({ email });

    // Mode validation
    if (mode === 'login') {
      if (!user) {
        if (req.logAuthAttempt) await req.logAuthAttempt(false);
        return res.status(404).json({ message: 'No account associated with this email. Please register first.' });
      }
    } else if (mode === 'register') {
      if (user) {
        if (req.logAuthAttempt) await req.logAuthAttempt(false);
        return res.status(400).json({ message: 'Account already exists. Please log in instead.' });
      }
      
      // Create user record in MongoDB
      user = await User.create({
        name: registerName || name || email.split('@')[0],
        email,
        password: crypto.randomBytes(16).toString('hex') // secure placeholder; auth managed by Firebase
      });
    } else if (mode === 'google') {
      if (!user) {
        user = await User.create({
          name: registerName || name || email.split('@')[0],
          email,
          password: crypto.randomBytes(16).toString('hex'),
          isEmailVerified: true
        });
      } else if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }
    } else if (mode === 'refresh') {
      if (!user) {
        if (req.logAuthAttempt) await req.logAuthAttempt(false);
        return res.status(401).json({ message: 'Session expired or user deleted.' });
      }
    } else {
      if (!user) {
        if (req.logAuthAttempt) await req.logAuthAttempt(false);
        return res.status(401).json({ message: 'Authentication required.' });
      }
    }

    // Initialize arrays if they don't exist (protects legacy database users)
    if (!user.activeSessions) user.activeSessions = [];
    if (!user.pinnedTools) user.pinnedTools = [];
    if (!user.recentHistory) user.recentHistory = [];

    // 3. Manage local session identifier cookie
    let sessionId = req.cookies.token;
    let sessionExists = sessionId && user.activeSessions.some(s => s.token === sessionId);

    if (!sessionExists) {
      // Generate new session token
      sessionId = crypto.randomBytes(32).toString('hex');
      
      // Add to user sessions
      user.activeSessions.push({
        token: sessionId,
        deviceName: getDeviceName(req.headers['user-agent']),
        lastActive: new Date()
      });

      // Enforce active session limit of 2 devices (FIFO)
      if (user.activeSessions.length > 2) {
        user.activeSessions = user.activeSessions.slice(user.activeSessions.length - 2);
      }

      await user.save();
    } else {
      // Update last active timestamp
      await User.updateOne(
        { _id: user._id, 'activeSessions.token': sessionId },
        { $set: { 'activeSessions.$.lastActive': new Date() } }
      );
    }

    // Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    const options = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true, // Safeguards against XSS extraction
      secure: isProd, // Production HTTPS only
      sameSite: isProd ? 'none' : 'lax' // Cross-domain cookie support in prod
    };

    if (req.logAuthAttempt) await req.logAuthAttempt(true);

    res
      .cookie('token', sessionId, options)
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: !!user.isEmailVerified,
        token: sessionId,
        pinnedTools: user.pinnedTools || [],
        favoriteTools: user.favoriteTools || [],
        recentHistory: user.recentHistory || [],
        activeSessions: user.activeSessions.map(s => ({
          _id: s._id,
          deviceName: s.deviceName,
          lastActive: s.lastActive,
          isCurrent: s.token === sessionId
        }))
      });
  } catch (error) {
    console.error('Session synchronization error:', error);
    if (req.logAuthAttempt) await req.logAuthAttempt(false);
    res.status(500).json({ message: 'Internal server error during session synchronization.' });
  }
};

// @desc    Logout user / clear session in database & cookie
// @route   GET /api/auth/logout
// @access  Public (graceful lookup)
exports.logoutUser = async (req, res) => {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (token) {
      // Remove this specific session token from user active list
      await User.findOneAndUpdate(
        { 'activeSessions.token': token },
        { $pull: { activeSessions: { token } } }
      );
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.status(200).json({ success: true, message: 'User logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error during logout.' });
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
      emailVerified: !!req.user.isEmailVerified,
      pinnedTools: req.user.pinnedTools || [],
      favoriteTools: req.user.favoriteTools || [],
      recentHistory: req.user.recentHistory || [],
      activeSessions: (req.user.activeSessions || []).map(s => ({
        _id: s._id,
        deviceName: s.deviceName,
        lastActive: s.lastActive,
        isCurrent: s.token === req.token
      }))
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error fetching user profile.' });
  }
};

// @desc    Update user profile name
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name } = req.body;
    if (name) user.name = name;

    await user.save();
    res.json({ success: true, name: user.name, email: user.email });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error updating user profile.' });
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
    user.activeSessions = (user.activeSessions || []).filter(s => s._id.toString() !== sessionId);
    await user.save();

    res.json({ success: true, message: 'Device logged out successfully.' });
  } catch (error) {
    console.error('Logout session error:', error);
    res.status(500).json({ message: 'Internal server error revoking session.' });
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
    user.recentHistory = (user.recentHistory || []).filter(h => h.toolPath !== toolPath);
    user.recentHistory.unshift({ toolPath, visitedAt: new Date() });

    // Strict limits: cap history list at 20 items to prevent MongoDB storage bloat
    if (user.recentHistory.length > 20) {
      user.recentHistory = user.recentHistory.slice(0, 20);
    }

    await user.save();
    res.json({ success: true, recentHistory: user.recentHistory });
  } catch (error) {
    console.error('Record visit error:', error);
    res.status(500).json({ message: 'Internal server error recording analytics.' });
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

    const isPinned = (user.pinnedTools || []).includes(toolPath);
    if (isPinned) {
      user.pinnedTools = user.pinnedTools.filter(p => p !== toolPath);
    } else {
      // Strict limits: cap pinned tools at 12 items
      if (user.pinnedTools.length >= 12) {
        return res.status(400).json({ message: 'Bookmark limit reached (maximum 12).' });
      }
      user.pinnedTools.push(toolPath);
    }

    await user.save();
    res.json({ success: true, pinnedTools: user.pinnedTools });
  } catch (error) {
    console.error('Update pin error:', error);
    res.status(500).json({ message: 'Internal server error updating pins.' });
  }
};

// @desc    Toggle a favorite tool in database bookmarks (max 24 items)
// @route   POST /api/auth/analytics/favorite
// @access  Private
exports.updateAnalyticsFavorite = async (req, res) => {
  try {
    const { toolPath } = req.body;
    if (!toolPath) {
      return res.status(400).json({ message: 'Tool path required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFav = (user.favoriteTools || []).includes(toolPath);
    if (isFav) {
      user.favoriteTools = user.favoriteTools.filter(p => p !== toolPath);
    } else {
      if (user.favoriteTools.length >= 24) {
        return res.status(400).json({ message: 'Favorite limit reached (maximum 24).' });
      }
      user.favoriteTools.push(toolPath);
    }

    await user.save();
    res.json({ success: true, favoriteTools: user.favoriteTools });
  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({ message: 'Internal server error updating favorites.' });
  }
};

const { sendOtpEmail } = require('../utils/mailer');

// @desc    Generate and send OTP email, return signed verification token
// @route   POST /api/auth/otp/send
// @access  Public
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOtpEmail(email, otp);

    const otpToken = jwt.sign(
      { email, otp }, 
      process.env.JWT_SECRET || 'fallback-secret', 
      { expiresIn: '3m' }
    );

    res.json({ success: true, token: otpToken });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP verification email.' });
  }
};

// @desc    Verify OTP code matches the signed token
// @route   POST /api/auth/otp/verify
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { token, code } = req.body;
    if (!token || !code) {
      return res.status(400).json({ message: 'Verification token and code are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      return res.status(400).json({ message: 'Verification code has expired or is invalid.' });
    }

    if (decoded.otp !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    await User.updateOne({ email: decoded.email }, { $set: { isEmailVerified: true } });

    res.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error verifying OTP.' });
  }
};
