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
    console.warn('⚠️ MONGO_URI environment variable is not defined.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,       // Safe connection pool to prevent exhausting MongoDB Atlas Free M0 quota
      minPoolSize: 1,
      serverSelectionTimeoutMS: 6000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`[Database] MongoDB Connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[Database] Connection Error: ${error.message}`);
    if (error.message.includes('whitelist') || error.name === 'MongooseServerSelectionError') {
      console.warn('⚠️ Atlas IP Whitelist Notice: Ensure 0.0.0.0/0 is added to MongoDB Atlas Network Access so Vercel can connect.');
    }
    return null;
  }
};

module.exports = connectDB;

