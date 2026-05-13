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

const app = express();
const httpServer = createServer(app);

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
