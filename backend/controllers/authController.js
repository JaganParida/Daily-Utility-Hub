const User = require('../models/User');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { sendOtpEmail } = require('../utils/mailer');

// Helper to ensure MongoDB is connected before DB operations
const ensureDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  return mongoose.connection.readyState === 1;
};

// Setup Google Firebase JWKS signing key client (legacy fallback)
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

// Unified session helper: manages active sessions (max 2 devices), sets HTTP-only cookie
const createSessionResponse = async (user, req, res, isNewUser = false) => {
  if (!user.activeSessions) user.activeSessions = [];
  if (!user.pinnedTools) user.pinnedTools = [];
  if (!user.recentHistory) user.recentHistory = [];
  if (!user.favoriteTools) user.favoriteTools = [];

  let sessionId = req.cookies.token;
  let sessionExists = sessionId && user.activeSessions.some(s => s.token === sessionId);

  if (!sessionExists) {
    sessionId = crypto.randomBytes(32).toString('hex');
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
    await User.updateOne(
      { _id: user._id, 'activeSessions.token': sessionId },
      { $set: { 'activeSessions.$.lastActive': new Date() } }
    );
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  };

  return res
    .cookie('token', sessionId, cookieOptions)
    .json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      authProvider: user.authProvider || 'local',
      emailVerified: !!user.isEmailVerified,
      isNewUser,
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
};

// =========================================================================
// 1. SIGNUP: STEP 1 - SEND OTP VIA NODEMAILER (ZERO DATABASE WRITE)
// =========================================================================
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Ensure DB connection is ready
    if (!(await ensureDB())) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
      });
    }

    // Check if user already exists in DB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'An account with this email address already exists. Please sign in instead.' 
      });
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

    console.log(`[Signup OTP] Delivering code to: ${cleanEmail}`);

    let emailSent = false;
    try {
      await sendOtpEmail(cleanEmail, otp);
      emailSent = true;
    } catch (err) {
      console.error('[Signup OTP] SMTP error:', err.message);
      if (!isProd) {
        console.log(`[DEV MODE] The Signup OTP for ${cleanEmail} is: ${otp}`);
      }
    }

    if (!emailSent && isProd) {
      return res.status(500).json({ 
        message: 'Failed to deliver verification code. Please check your email or try again later.' 
      });
    }

    // Cryptographic hash of OTP inside signed token (valid for 5 mins)
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const signupOtpToken = jwt.sign(
      { email: cleanEmail, name: (name || '').trim(), otpHash },
      process.env.JWT_SECRET || 'daily-utility-hub-auth-secret-key',
      { expiresIn: '5m' }
    );

    // ZERO database record created here! MongoDB remains untouched.
    res.json({
      success: true,
      signupOtpToken,
      devOtp: (!isProd && !emailSent) ? otp : undefined,
      message: 'Verification code sent to your email.'
    });
  } catch (error) {
    console.error('sendRegisterOtp error:', error);
    const isConnErr = error.name === 'MongooseServerSelectionError' || error.message?.includes('buffering timed out');
    res.status(isConnErr ? 503 : 500).json({ 
      message: isConnErr 
        ? 'Database connection timed out. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
        : 'Internal server error sending verification code.' 
    });
  }
};

// =========================================================================
// 2. SIGNUP: STEP 2 - VERIFY OTP & CREATE USER IN MONGODB
// =========================================================================
exports.verifyRegisterOtpAndCreateUser = async (req, res) => {
  try {
    const { signupOtpToken, otp, password, name } = req.body;

    if (!signupOtpToken || !otp) {
      return res.status(400).json({ message: 'Verification token and OTP are required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // 1. Verify token
    let decoded;
    try {
      decoded = jwt.verify(signupOtpToken, process.env.JWT_SECRET || 'daily-utility-hub-auth-secret-key');
    } catch (err) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // 2. Verify OTP hash
    const inputHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (inputHash !== decoded.otpHash) {
      return res.status(400).json({ message: 'Incorrect verification code. Please check and try again.' });
    }

    const cleanEmail = decoded.email.toLowerCase();

    // Ensure DB is ready
    if (!(await ensureDB())) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
      });
    }

    // 3. Double-check if account exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    // 4. Create User in MongoDB (Password is automatically hashed by User model pre-save hook)
    const user = await User.create({
      name: (name || decoded.name || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      password: password,
      isEmailVerified: true,
      authProvider: 'local'
    });

    console.log(`[Account Created] Successfully registered verified user: ${cleanEmail}`);

    return await createSessionResponse(user, req, res, true);
  } catch (error) {
    console.error('verifyRegisterOtpAndCreateUser error:', error);
    const isConnErr = error.name === 'MongooseServerSelectionError' || error.message?.includes('buffering timed out');
    res.status(isConnErr ? 503 : 500).json({ 
      message: isConnErr 
        ? 'Database connection timed out. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
        : 'Failed to create account. Please try again.' 
    });
  }
};

// =========================================================================
// 3. LOGIN: EMAIL & PASSWORD (VERIFIED DIRECTLY AGAINST MONGODB)
// =========================================================================
exports.loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Ensure DB is ready
    if (!(await ensureDB())) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      if (req.logAuthAttempt) await req.logAuthAttempt(false);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account was created with Google Sign-In. Please click "Continue with Google".' 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      if (req.logAuthAttempt) await req.logAuthAttempt(false);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (req.logAuthAttempt) await req.logAuthAttempt(true);
    return await createSessionResponse(user, req, res, false);
  } catch (error) {
    console.error('loginWithPassword error:', error);
    const isConnErr = error.name === 'MongooseServerSelectionError' || error.message?.includes('buffering timed out');
    res.status(isConnErr ? 503 : 500).json({ 
      message: isConnErr 
        ? 'Database connection timed out. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
        : 'Internal server error during login.' 
    });
  }
};

// =========================================================================
// 4. GOOGLE AUTH (GOOGLE CLOUD OAUTH 2.0 / GOOGLE IDENTITY SERVICES)
// =========================================================================
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is required.' });
    }

    // Ensure DB connection is ready
    if (!(await ensureDB())) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
      });
    }

    // Verify credential directly against Google OAuth tokeninfo endpoint
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const googleRes = await fetch(googleVerifyUrl);

    if (!googleRes.ok) {
      const errData = await googleRes.json().catch(() => ({}));
      console.error('Google token verification failed:', errData);
      return res.status(401).json({ message: 'Google token verification failed or expired.' });
    }

    const googlePayload = await googleRes.json();

    if (googlePayload.iss !== 'accounts.google.com' && googlePayload.iss !== 'https://accounts.google.com') {
      return res.status(401).json({ message: 'Invalid Google token issuer.' });
    }

    const email = googlePayload.email ? googlePayload.email.toLowerCase() : null;
    if (!email) {
      return res.status(400).json({ message: 'Unable to retrieve verified email from Google.' });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        name: googlePayload.name || googlePayload.given_name || email.split('@')[0],
        email: email,
        isEmailVerified: true,
        authProvider: 'google',
        avatar: googlePayload.picture || ''
      });
      isNewUser = true;
      console.log(`[Google Auth] Created new user: ${email}`);
    } else {
      if (!user.avatar && googlePayload.picture) {
        user.avatar = googlePayload.picture;
        await user.save();
      }
    }

    return await createSessionResponse(user, req, res, isNewUser);
  } catch (error) {
    console.error('googleAuth error:', error);
    const isConnErr = error.name === 'MongooseServerSelectionError' || error.message?.includes('buffering timed out') || error.message?.includes('whitelist');
    res.status(isConnErr ? 503 : 500).json({ 
      message: isConnErr 
        ? 'Database connection timed out. Please check MongoDB Atlas IP whitelist (0.0.0.0/0).' 
        : (error.message || 'Google authentication error.') 
    });
  }
};

// =========================================================================
// 5. LEGACY SESSION SYNC (FALLBACK SUPPORT)
// =========================================================================
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
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        name: registerName || name || email.split('@')[0],
        email,
        password: crypto.randomBytes(16).toString('hex'),
        isEmailVerified: true
      });
      isNewUser = true;
    }

    return await createSessionResponse(user, req, res, isNewUser);
  } catch (error) {
    console.error('Session synchronization error:', error);
    res.status(500).json({ message: 'Internal server error during session synchronization.' });
  }
};

// =========================================================================
// 6. LOGOUT
// =========================================================================
exports.logoutUser = async (req, res) => {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (token) {
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

// =========================================================================
// 7. USER PROFILE & SETTINGS
// =========================================================================
exports.getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json(null);
    }
    
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar || '',
      authProvider: req.user.authProvider || 'local',
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

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, avatar } = req.body;
    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ success: true, name: user.name, email: user.email, avatar: user.avatar });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error updating user profile.' });
  }
};

exports.logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.activeSessions = (user.activeSessions || []).filter(s => s._id.toString() !== sessionId);
    await user.save();

    res.json({ success: true, message: 'Device logged out successfully.' });
  } catch (error) {
    console.error('Logout session error:', error);
    res.status(500).json({ message: 'Internal server error revoking session.' });
  }
};

// =========================================================================
// 8. ANALYTICS & BOOKMARKS
// =========================================================================
exports.recordAnalyticsVisit = async (req, res) => {
  try {
    const { toolPath } = req.body;
    if (!toolPath) return res.status(400).json({ message: 'Tool path required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.recentHistory = (user.recentHistory || []).filter(h => h.toolPath !== toolPath);
    user.recentHistory.unshift({ toolPath, visitedAt: new Date() });

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

exports.updateAnalyticsPin = async (req, res) => {
  try {
    const { toolPath } = req.body;
    if (!toolPath) return res.status(400).json({ message: 'Tool path required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPinned = (user.pinnedTools || []).includes(toolPath);
    if (isPinned) {
      user.pinnedTools = user.pinnedTools.filter(p => p !== toolPath);
    } else {
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

exports.updateAnalyticsFavorite = async (req, res) => {
  try {
    const { toolPath } = req.body;
    if (!toolPath) return res.status(400).json({ message: 'Tool path required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

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

// =========================================================================
// 9. GENERAL OTP & EMAIL AVAILABILITY
// =========================================================================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    let emailSent = false;
    try {
      await sendOtpEmail(cleanEmail, otp);
      emailSent = true;
    } catch (emailError) {
      console.error('[OTP] SMTP Error:', emailError.message);
      if (!isProd) {
        console.log(`[OTP] Fallback DEV MODE: The OTP for ${cleanEmail} is: ${otp}`);
      }
    }

    if (!emailSent && isProd) {
      return res.status(500).json({ 
        message: 'Failed to send OTP verification email. Please check your email address or try again later.' 
      });
    }

    const otpToken = jwt.sign(
      { email: cleanEmail, otp }, 
      process.env.JWT_SECRET || 'daily-utility-hub-auth-secret-key', 
      { expiresIn: '3m' }
    );

    res.json({ 
      success: true, 
      token: otpToken, 
      devOtp: (!isProd && !emailSent) ? otp : undefined,
      message: emailSent ? 'OTP sent successfully.' : 'Email delivery failed. OTP is available in dev console.'
    });
  } catch (error) {
    console.error('[OTP] Send OTP FAILED:', error.message || error);
    res.status(500).json({ 
      message: 'Failed to send OTP verification email.', 
      error: error.message || String(error)
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { token, code, otp: directOtp } = req.body;
    const inputCode = String(code || directOtp || '').trim();

    if (!token || !inputCode) {
      return res.status(400).json({ message: 'Verification token and code are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'daily-utility-hub-auth-secret-key');
    } catch (err) {
      return res.status(400).json({ message: 'Verification code has expired or is invalid.' });
    }

    if (decoded.otp !== inputCode) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    res.json({ success: true, email: decoded.email });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error verifying OTP.' });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('_id').lean();
    if (!user) return res.status(404).json({ message: 'No account found with this email address.' });

    res.json({ success: true, message: 'Account exists.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error checking email.' });
  }
};

exports.checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required.' });

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() }).select('_id').lean();
    if (existingUser) {
      return res.status(409).json({ available: false, message: 'An account already exists with this email address.' });
    }

    res.json({ available: true, message: 'Email address is available.' });
  } catch (error) {
    res.json({ available: true, message: 'Proceeding to verification.' });
  }
};
