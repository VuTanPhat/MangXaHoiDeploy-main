import express from "express";
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  removeProjectMember,
  deleteProject,
  getAllProjects,
  adminDeleteProject,
} from "../controllers/projectController.js";
import { adminOnly } from "../middlewares/adminAuth.js";

const router = express.Router();

router.post("/create", createProject);
router.get("/my", getUserProjects);
router.get("/all", adminOnly, getAllProjects);
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);
router.delete("/admin/:projectId", adminOnly, adminDeleteProject);
router.post("/:projectId/member", addProjectMember);
router.delete("/:projectId/member/:memberId", removeProjectMember);

export default router;
