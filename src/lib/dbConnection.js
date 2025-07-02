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
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
      };

      cached.promise = mongoose.connect(process.env.MONGODB_URI, opts);
    }

    // Wait for the connection to be established
    cached.conn = await cached.promise;
    
    return cached.conn;
  } catch (error) {
    // Reset promise so it can be retried
    cached.promise = null;
    console.error('Database connection error:', error);
    throw error;
  }
};

export default connectDB;
