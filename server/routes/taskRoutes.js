import express from "express";
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  createTaskHandover,
  acceptHandover,
  rejectHandover,
  getUserHandovers,
  logTime,
  getTaskTimeLogs,
} from "../controllers/taskController.js";

const router = express.Router();

// Static routes first (before dynamic :taskId routes)
router.post("/create", createTask);
router.get("/project/:projectId", getProjectTasks);
router.get("/handovers/my", getUserHandovers);
router.post("/handover/:handoverId/accept", acceptHandover);
router.post("/handover/:handoverId/reject", rejectHandover);

// Dynamic :taskId routes
router.get("/:taskId", getTaskById);
router.put("/:taskId", updateTask);
router.put("/:taskId/status", updateTaskStatus);
router.delete("/:taskId", deleteTask);
router.post("/:taskId/handover", createTaskHandover);
router.post("/:taskId/time-log", logTime);
router.get("/:taskId/time-logs", getTaskTimeLogs);

export default router;
