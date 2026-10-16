const express = require('express');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force IPv4 first to resolve MongoDB Atlas DNS issues on Node 18+
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const setupCleanupJobs = require('./jobs/cleanup');

const path = require('path');

// Load env vars (checks backend/.env first, then root .env)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Connect to database (uses cached serverless pool)
connectDB();

// Initialize Cron Jobs only when running as persistent daemon, not in Vercel serverless
if (!process.env.VERCEL) {
  setupCleanupJobs();
}

const app = express();

// Trust proxy for accurate client IP rate limiting behind reverse proxies (Render, Vercel, etc.)
app.set('trust proxy', 1);

// Ensure DB is connected for all incoming /api calls in serverless
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
    } catch (_) {}
  }
  next();
});

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable Strict CORS (Allow configured CLIENT_URL, verified Vercel deploy domains, and local dev)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://daily-utility-hub-orpin.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = 
      allowedOrigins.includes(origin) || 
      /^https:\/\/daily-utility-hub(-[a-z0-9-]+)?\.vercel\.app$/.test(origin) || 
      (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy.'));
  },
  credentials: true
}));


// Set security headers (Allow cross-origin popups for Firebase Auth interaction)
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Redefine query as writable for Express 5 compatibility with mongoSanitize and hpp
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: { ...req.query },
      writable: true,
      configurable: true
    });
  }
  next();
});

// Prevent NoSQL Injection
app.use(mongoSanitize());

// Prevent http param pollution
app.use(hpp());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const { sendOtp } = require('./controllers/authController');
const { userRateLimiter } = require('./middleware/rateLimitMiddleware');
app.post('/api/send-otp', userRateLimiter, sendOtp);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/share', require('./routes/shareRoute'));

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Daily Utility Hub API', env: process.env.NODE_ENV || 'production' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.message === 'Blocked by CORS policy.') {
    return res.status(403).json({ message: 'Blocked by CORS policy.' });
  }
  console.error('🔥🔥🔥 Global Express Error:', err);
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
});

const PORT = process.env.PORT || 5000;

// Only start standalone HTTP server when not in Vercel serverless environment
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;

