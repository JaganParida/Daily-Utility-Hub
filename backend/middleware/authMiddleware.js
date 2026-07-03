const User = require('../models/User');

// Verify cookie session token directly against active sessions list in MongoDB
const protect = async (req, res, next) => {
  let token;

  // Read session token from cookie (web) or Auth header (API fallback)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, please log in.' });
  }

  try {
    // Look up user holding this active session token in the database
    const user = await User.findOne({ 'activeSessions.token': token });

    if (!user) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      return res.status(401).json({ message: 'Session expired or logged out from this device.' });
    }

    // Attach user and current session token signature to the request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({ message: 'Server authentication verification error.' });
  }
};

const softProtect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const user = await User.findOne({ 'activeSessions.token': token });
    if (user) {
      req.user = user;
      req.token = token;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { protect, softProtect };
