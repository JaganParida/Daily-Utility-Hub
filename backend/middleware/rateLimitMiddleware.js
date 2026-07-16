const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const AuthAttempt = require('../models/AuthAttempt');

// 1. Custom Auth Rate Limiter with Exponential Backoff
const authRateLimiter = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { idToken } = req.body;
  let email = null;

  if (idToken) {
    try {
      // Decode Firebase JWT payload without verifying signature first (for email mapping)
      const decoded = jwt.decode(idToken);
      if (decoded && decoded.email) {
        email = decoded.email.toLowerCase().trim();
      }
    } catch (err) {
      // Ignore token decoding failure here; verified properly inside syncSession controller
    }
  }

  // Load configurable values from env
  const windowMs = parseInt(process.env.AUTH_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 mins window
  const maxDelaySec = parseInt(process.env.AUTH_LIMIT_MAX_DELAY_SEC, 10) || 60; // Max 60 seconds delay

  try {
    // Query failed login/registration attempts in the window
    const query = {
      $or: [{ ip }],
      timestamp: { $gte: new Date(Date.now() - windowMs) }
    };
    
    if (email) {
      query.$or.push({ email });
    }

    const attempts = await AuthAttempt.find(query).sort({ timestamp: -1 });
    const failuresCount = attempts.length;

    if (failuresCount > 0) {
      // Backoff calculation: 2^(failuresCount - 1) seconds
      // 1st failure: 1s, 2nd: 2s, 3rd: 4s, 4th: 8s, 5th: 16s, 6th: 32s, 7th+: capped at maxDelaySec (e.g. 60s)
      const delaySec = Math.min(Math.pow(2, failuresCount - 1), maxDelaySec);
      const lastAttempt = attempts[0];
      const timeElapsedMs = Date.now() - lastAttempt.timestamp.getTime();
      const timeRemainingMs = (delaySec * 1000) - timeElapsedMs;

      if (timeRemainingMs > 0) {
        const retryAfter = Math.ceil(timeRemainingMs / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          message: `Too many auth attempts. Please try again in ${retryAfter} seconds.`,
          retryAfterSeconds: retryAfter
        });
      }
    }

    // Attach function to log success or failure inside controllers
    req.logAuthAttempt = async (successful) => {
      try {
        if (successful) {
          // Success: delete all failure records for this IP/email
          const deleteQuery = { $or: [{ ip }] };
          if (email) deleteQuery.$or.push({ email });
          await AuthAttempt.deleteMany(deleteQuery);
        } else {
          // Failure: log new auth attempt
          await AuthAttempt.create({ ip, email, timestamp: new Date() });
        }
      } catch (err) {
        console.error('[RateLimiter] Error logging auth attempt:', err);
      }
    };

    next();
  } catch (err) {
    console.error('[RateLimiter] Auth limiter error:', err);
    next(); // Fallback: proceed if MongoDB queries fail to prevent locking users out entirely
  }
};

// 2. Public Endpoints Rate Limiter (e.g. metadata lookup, downloads, basic status endpoints)
const publicRateLimiter = rateLimit({
  windowMs: parseInt(process.env.PUBLIC_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.PUBLIC_LIMIT_MAX, 10) || 150,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip)
});

// 3. Authenticated User Action Rate Limiter (e.g. upload, PDF tools, account edits)
const userRateLimiter = rateLimit({
  windowMs: parseInt(process.env.USER_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.USER_LIMIT_MAX, 10) || 500,
  message: { message: 'Too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user account if logged in, fallback to IP (masked for IPv6 safety)
    return req.user ? req.user._id.toString() : ipKeyGenerator(req.ip);
  }
});

module.exports = {
  authRateLimiter,
  publicRateLimiter,
  userRateLimiter
};
