import express from "express";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/create", protect, createGroup);
groupRouter.get("/my", protect, getUserGroups);
groupRouter.post("/messages", protect, getGroupMessages);
groupRouter.post("/send", protect, upload.single("image"), sendGroupMessage);

export default groupRouter;
