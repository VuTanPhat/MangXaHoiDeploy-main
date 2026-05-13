import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database connected")
    );
    mongoose.connection.on("error", (err) =>
      console.log("Database error:", err.message)
    );

    await mongoose.connect(`${process.env.MONGODB_URI}/pingup`, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
