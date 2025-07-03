import mongoose from 'mongoose';

// Global connection cache to prevent multiple connections in serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // If we already have a connection, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we don't have a promise, create one
    if (!cached.promise) {
      const opts = {
        dbName: "user-data",
        bufferCommands: false, // Disable mongoose buffering
        maxPoolSize: 10, // Maximum number of connections in the pool
        serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 30000, // Connection timeout
        family: 4, // Use IPv4, skip trying IPv6
        // SSL/TLS Configuration
        ssl: true,
        retryWrites: true,
        retryReads: true,
        // Additional MongoDB driver options for better connection stability
        minPoolSize: 1, // Minimum number of connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        waitQueueTimeoutMS: 10000, // How long to wait for a connection to become available
        heartbeatFrequencyMS: 10000, // How often to check the connection
        // Disable compression to reduce SSL overhead
        compressors: [],
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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    
    throw error;
  }
};

export default connectDB;
