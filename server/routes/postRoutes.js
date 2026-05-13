import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  getFeedPosts,
  likePost,
  addComment,
  getComments,
  deleteComment,
  sharePost,
  deletePost,
  updatePost,
} from "../controllers/postController.js";

const postRouter = express.Router();

postRouter.post("/add", upload.array("images", 4), protect, addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/like", protect, likePost);

// Comment routes
postRouter.post("/comment", protect, addComment);
postRouter.get("/comments/:postId", protect, getComments);
postRouter.delete("/comment/:commentId", protect, deleteComment);

// Share route
postRouter.post("/share", protect, sharePost);

// Delete and Update post routes
postRouter.delete("/:postId", protect, deletePost);
postRouter.put("/:postId", protect, updatePost);

export default postRouter;
