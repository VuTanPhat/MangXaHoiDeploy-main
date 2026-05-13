import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database connected")
    );
    mongoose.connection.on("error", (err) =>
      console.log("Database error:", err.message)
    );

    const mongoUri = process.env.MONGODB_URI?.trim();
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(`${mongoUri}/pingup`, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    throw error;
  }
};

export default connectDB;
