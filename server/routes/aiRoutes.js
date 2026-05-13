import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  chatWithAI,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  renameConversation,
} from "../controllers/aiController.js";

const aiRouter = express.Router();

// Chat
aiRouter.post("/chat", protect, chatWithAI);

// Conversations
aiRouter.get("/conversations", protect, getConversations);
aiRouter.get("/conversation/:conversationId", protect, getConversation);
aiRouter.post("/conversation", protect, createConversation);
aiRouter.delete("/conversation/:conversationId", protect, deleteConversation);
aiRouter.put("/conversation/:conversationId", protect, renameConversation);

export default aiRouter;
