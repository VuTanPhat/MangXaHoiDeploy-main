import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    title: { type: String, default: "Cuộc trò chuyện mới" },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const AIConversation = mongoose.model("AIConversation", aiConversationSchema);

export default AIConversation;
