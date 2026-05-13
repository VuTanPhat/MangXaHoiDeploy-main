import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: String, ref: "User", required: true },
    content: { type: String, required: true },
    likes: [{ type: String, ref: "User" }],
    parent_comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true, minimize: false }
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
