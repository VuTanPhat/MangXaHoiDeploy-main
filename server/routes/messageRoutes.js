import express from "express";
import {
  getChatMessages,
  sendMessage,
  sseController,
  deleteMessage,
} from "../controllers/messageController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.post("/send", upload.single("image"), protect, sendMessage);
messageRouter.post("/get", protect, getChatMessages);
messageRouter.delete("/delete/:message_id", protect, deleteMessage);

messageRouter.get("/:userId", sseController);

export default messageRouter;
