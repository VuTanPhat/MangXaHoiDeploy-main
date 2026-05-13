import express from "express";
import {
  createSprint,
  getProjectSprints,
  getSprintById,
  updateSprint,
  startSprint,
  completeSprint,
  getSprintBurndown,
} from "../controllers/sprintController.js";

const router = express.Router();

router.post("/create", createSprint);
router.get("/project/:projectId", getProjectSprints);
router.get("/:sprintId", getSprintById);
router.put("/:sprintId", updateSprint);
router.post("/:sprintId/start", startSprint);
router.post("/:sprintId/complete", completeSprint);
router.get("/:sprintId/burndown", getSprintBurndown);

export default router;
