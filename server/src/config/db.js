const mongoose = require('mongoose');

let mongoMemoryServer = null;

/**
 * Connect to MongoDB with graceful fallback to in-memory instance
 * if no MONGODB_URI is provided.
 */
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.log('ℹ️  No MONGODB_URI detected. Initializing embedded in-memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      mongoUri = mongoMemoryServer.getUri();
      console.log(`✅ In-memory MongoDB running at: ${mongoUri}`);
    } else {
      console.log(`ℹ️  Connecting to configured MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//<credentials>@')}`);
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`🚀 Connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`);
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB and stop in-memory server if running.
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('🛑 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
