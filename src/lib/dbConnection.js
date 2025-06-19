import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      return true;
    }

    const { connection } = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "user-data"
    });

    console.log(`MongoDB Connected: ${connection.host}`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export default connectDB;
