const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const User = require('../models/User');

// Configure JWKS client to fetch Google's public keys for Firebase Auth
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
});

// Helper to get signing key
const getSigningKey = (header, callback) => {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // Check if token looks like a Firebase ID token (is it RS256 / has issuer securetoken)
  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (decodedHeader && decodedHeader.header.alg === 'RS256') {
      // Verify via Google JWKS
      jwt.verify(
        token,
        getSigningKey,
        {
          issuer: 'https://securetoken.google.com/daily-utility-hub',
          audience: 'daily-utility-hub',
          algorithms: ['RS256']
        },
        async (err, decoded) => {
          if (err) {
            console.error('Firebase Auth Verification Error:', err.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
          }

          // Attach user properties from token claim
          req.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0]
          };
          return next();
        }
      );
    } else {
      // Fallback: Verify via local JWT secret (dev only)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attempt database lookup if user exists in MongoDB
      try {
        const dbUser = await User.findById(decoded.id).select('-password');
        if (dbUser) {
          req.user = dbUser;
        } else {
          req.user = { id: decoded.id };
        }
      } catch (dbErr) {
        req.user = { id: decoded.id };
      }
      return next();
    }
  } catch (error) {
    console.error('Auth verification exception:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const softProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (decodedHeader && decodedHeader.header.alg === 'RS256') {
      jwt.verify(
        token,
        getSigningKey,
        {
          issuer: 'https://securetoken.google.com/daily-utility-hub',
          audience: 'daily-utility-hub',
          algorithms: ['RS256']
        },
        (err, decoded) => {
          if (err) {
            req.user = null;
          } else {
            req.user = {
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0]
            };
          }
          next();
        }
      );
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      try {
        const dbUser = await User.findById(decoded.id).select('-password');
        req.user = dbUser || { id: decoded.id };
      } catch (dbErr) {
        req.user = { id: decoded.id };
      }
      next();
    }
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { protect, softProtect };
