const mongoose = require('mongoose');

// Cache the MongoDB connection across Vercel serverless function executions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const DEFAULT_MONGO_URI = 'mongodb://Jagan26:jXgBMNrF3pRoOAk1@ac-mmwqbce-shard-00-00.wufvo4w.mongodb.net:27017,ac-mmwqbce-shard-00-01.wufvo4w.mongodb.net:27017,ac-mmwqbce-shard-00-02.wufvo4w.mongodb.net:27017/?ssl=true&replicaSet=atlas-g0jwcg-shard-0&authSource=admin&appName=Cluster0';

const connectDB = async () => {
  // Return active connection if already established
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;

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

