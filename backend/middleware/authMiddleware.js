const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Read from cookies (first choice for web clients) or authorization header (API fallback)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, please log in.' });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify token exists in the user's active sessions array in the database
    const user = await User.findOne({ _id: decoded.id, 'activeSessions.token': token });

    if (!user) {
      // Clear cookie if session is revoked or invalid
      res.clearCookie('token');
      return res.status(401).json({ message: 'Session expired or logged out from this device.' });
    }

    // Attach user and current session token to the request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Session verification error:', error);
    res.clearCookie('token');
    return res.status(401).json({ message: 'Not authorized, token failed.' });
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, 'activeSessions.token': token });
    
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
