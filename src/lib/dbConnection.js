import mongoose from 'mongoose';

// Global connection cache to prevent multiple connections in serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // If we already have a connection, return it
    if (cached.conn && cached.conn.readyState === 1) {
      return cached.conn;
    }

    // If we don't have a promise, create one
    if (!cached.promise) {
      const opts = {
        dbName: "user-data",
        bufferCommands: false, // Disable mongoose buffering
        maxPoolSize: 50, // Increased pool size for high concurrency
        serverSelectionTimeoutMS: 10000, // Reduced timeout for faster failover
        socketTimeoutMS: 20000, // Reduced socket timeout
        connectTimeoutMS: 10000, // Reduced connection timeout
        family: 4, // Use IPv4, skip trying IPv6
        // SSL/TLS Configuration
        ssl: true,
        retryWrites: true,
        retryReads: true,
        // Optimized connection pool settings for high load
        minPoolSize: 5, // Higher minimum connections
        maxIdleTimeMS: 10000, // Shorter idle time to free up connections faster
        waitQueueTimeoutMS: 5000, // Reduced wait time for available connections
        heartbeatFrequencyMS: 5000, // More frequent heartbeats for faster detection
        // Disable compression to reduce SSL overhead
        compressors: [],
        // Additional performance optimizations
        autoCreate: false, // Don't auto-create collections
        autoIndex: false, // Disable auto-indexing for better performance
      };


      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        // Reset cached connection on error
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('disconnected', () => {
        // Reset cached connection on disconnect
        cached.conn = null;
        cached.promise = null;
      });

      cached.promise = mongoose.connect(process.env.MONGODB_URI, opts);
    }

    // Wait for the connection to be established
    cached.conn = await cached.promise;
    
    return cached.conn;
  } catch (error) {
    // Reset promise so it can be retried
    cached.promise = null;
    cached.conn = null;
    
    console.error('Database connection error:', error);
    
    throw error;
  }
};

export default connectDB;
