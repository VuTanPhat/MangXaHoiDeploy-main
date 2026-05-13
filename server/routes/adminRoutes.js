import express from "express";
import { protect } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/adminAuth.js";
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  changeUserRole,
  getAllPosts,
  deletePostByAdmin,
  getUserDetail,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Tất cả routes đều cần protect + adminOnly
adminRouter.use(protect, adminOnly);

// Dashboard
adminRouter.get("/stats", getDashboardStats);

// User management
adminRouter.get("/users", getAllUsers);
adminRouter.get("/user/:userId", getUserDetail);
adminRouter.put("/user/:userId/toggle-status", toggleUserStatus);
adminRouter.put("/user/:userId/role", changeUserRole);
adminRouter.delete("/user/:userId", deleteUser);

// Post management
adminRouter.get("/posts", getAllPosts);
adminRouter.delete("/post/:postId", deletePostByAdmin);

export default adminRouter;
