const mongoose = require('mongoose');

const authAttemptSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL index: auto delete records older than 24 hours (86400 seconds)
  }
});

module.exports = mongoose.model('AuthAttempt', authAttemptSchema);
