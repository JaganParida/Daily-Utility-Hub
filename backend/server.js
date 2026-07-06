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

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Cron Jobs
setupCleanupJobs();

const app = express();

// Trust proxy for accurate client IP rate limiting behind reverse proxies (Render, Vercel, etc.)
app.set('trust proxy', 1);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS (Configure strictly for production)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Frontend URL
  credentials: true
}));

// Set security headers (Allow cross-origin popups for Firebase Auth interaction)
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
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
// We will handle XSS on the client-side and use DOMPurify when necessary.

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // 100 requests per windowMs
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/share', require('./routes/shareRoute'));
// app.use('/api/users', require('./routes/users'));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥🔥🔥 Global Express Error:', err);
  console.error(err.stack);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
