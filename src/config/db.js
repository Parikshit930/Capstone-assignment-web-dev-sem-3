const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_management_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Standard MongoDB connection failed: ${err.message}`);
    // If local MongoDB is not running or running in test/demo mode, spin up MongoMemoryServer
    try {
      console.log('[Database] Initializing fallback in-memory MongoDB server for development/demo...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] In-memory MongoDB Connected successfully: ${memUri}`);
      return conn;
    } catch (fallbackErr) {
      console.error('[Database] Failed to connect to both standard and in-memory MongoDB:', fallbackErr.message);
      throw fallbackErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('[Database] MongoDB connection closed.');
  } catch (err) {
    console.error('[Database] Error closing MongoDB connection:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
