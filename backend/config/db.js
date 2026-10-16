const mongoose = require('mongoose');

// Cache the MongoDB connection across Vercel serverless function executions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Return active connection if already established
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('WARNING: MONGO_URI is not defined. Offline/guest mode active.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents serverless functions hanging on connection delay
      maxPoolSize: 10,       // Safe connection pool to prevent exhausting MongoDB Atlas Free M0 quota
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`MongoDB Connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('WARNING: Running without MongoDB. Auth features will not work, but utility tools will continue to function.');
    return null;
  }
};

module.exports = connectDB;

