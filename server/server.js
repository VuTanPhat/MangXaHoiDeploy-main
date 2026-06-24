import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRotes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import sprintRouter from "./routes/sprintRoutes.js";
import { setupSocketIO } from "./socket/videoCall.js";
import User from "./models/User.js";

const app = express();
const httpServer = createServer(app);

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Admin User";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin_user";

const ensureAdminAccount = async () => {
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    console.log("✓ Đã tồn tại admin trong database.");
    return;
  }

  if (ADMIN_USER_ID) {
    const user = await User.findById(ADMIN_USER_ID);
    if (user) {
      user.role = "admin";
      user.isActive = true;
      await user.save();
      console.log(`✓ Đã cập nhật user ${ADMIN_USER_ID} thành admin.`);
      return;
    }

    await User.create({
      _id: ADMIN_USER_ID,
      email: ADMIN_EMAIL,
      full_name: ADMIN_FULL_NAME,
      username: ADMIN_USERNAME,
      role: "admin",
      isActive: true,
    });
    console.log(`✓ Đã tạo admin mới với ID ${ADMIN_USER_ID}.`);
    return;
  }

  const firstUser = await User.findOne();
  if (firstUser) {
    firstUser.role = "admin";
    firstUser.isActive = true;
    await firstUser.save();
    console.log(`✓ Đã gán user ${firstUser._id} làm admin mặc định.`);
    return;
  }

  console.log(
    "⚠️  Chưa có user nào trong database để gán admin. Vui lòng đăng ký một user trước hoặc cấu hình ADMIN_USER_ID."
  );
};

let isInitialized = false;
let initializationError = null;
let initPromise = null;

// Initialize server - called only once
async function initializeServer() {
  if (isInitialized || initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("🔄 Starting server initialization...");

      // Setup Socket.IO
      const io = new Server(httpServer, {
        cors: {
          origin: process.env.CLIENT_URL || "http://localhost:5173",
          methods: ["GET", "POST"],
        },
      });
      setupSocketIO(io);

      // Connect to database
      await connectDB();
      console.log("✓ Database connected");

      // Create default admin account if configured
      await ensureAdminAccount();

      // Middleware
      app.use(express.json());
      app.use(cors());
      app.use(clerkMiddleware());

      // Routes
      app.get("/", (req, res) => res.send("Server is running"));
      app.use("/api/inngest", serve({ client: inngest, functions }));
      app.use("/api/user", userRouter);
      app.use("/api/post", postRouter);
      app.use("/api/story", storyRouter);
      app.use("/api/message", messageRouter);
      app.use("/api/group", groupRouter);
      app.use("/api/ai", aiRouter);
      app.use("/api/admin", adminRouter);
      app.use("/api/project", projectRouter);
      app.use("/api/task", taskRouter);
      app.use("/api/sprint", sprintRouter);

      // Global error handler
      app.use((err, req, res, next) => {
        console.error("Error:", err);
        res.status(err.status || 500).json({
          error: err.message || "Internal Server Error",
          id: err.id || "UNKNOWN",
        });
      });

      isInitialized = true;
      console.log("✓ Server initialization complete");
    } catch (error) {
      initializationError = error;
      console.error("✗ Server initialization failed:", error.message);
      console.error("Stack:", error.stack);
      throw error;
    }
  })();

  return initPromise;
}

// Initialize on module load
initializeServer().catch((err) => {
  console.error("Fatal error during initialization:", err);
});

// Middleware to ensure initialization is complete before handling requests
app.use(async (req, res, next) => {
  try {
    if (!isInitialized) {
      if (initializationError) {
        return res.status(503).json({
          error: "Server failed to initialize",
          details: initializationError.message,
        });
      }
      await initPromise;
    }
    next();
  } catch (error) {
    res.status(503).json({
      error: "Server initialization in progress",
      details: error.message,
    });
  }
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () =>
    console.log(`✓ Server is running on port ${PORT}`)
  );
}

// For Vercel Serverless Functions
export default app;
