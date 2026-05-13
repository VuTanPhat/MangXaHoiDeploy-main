import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id: { type: String, ref: "User" }, // 1-1 chat
    group_id: { type: String, ref: "Group", default: null }, // 🔥 thêm cho chat nhóm
    text: { type: String, trim: true },
    message_type: { type: String, enum: ["text", "image", "call"] },
    media_url: { type: String },
    imagekit_file_id: { type: String, default: "" },
    seen: { type: Boolean, default: false },
    // Call-related fields
    call_type: { type: String, enum: ["video", "audio"], default: null },
    call_duration: { type: Number, default: 0 }, // in seconds
    call_status: {
      type: String,
      enum: ["missed", "answered", "rejected"],
      default: null,
    },
  },
  { timestamps: true, minimize: false }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
