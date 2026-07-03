const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('WARNING: Running without MongoDB. Auth features will not work, but utility tools will continue to function.');
    // Removed process.exit(1) so utility APIs (like PDF manipulation) can still run without MongoDB.
  }
};

module.exports = connectDB;
