import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

    let image_urls = [];

    if (images.length) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);
          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });
          return url;
        })
      );
    }

    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });
    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Posts
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    // User connections and followings
    const userIds = [userId, ...user.connections, ...user.following];
    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user")
      .populate({
        path: "shared_post",
        populate: { path: "user" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Like Post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (post.likes_count.includes(userId)) {
      post.likes_count = post.likes_count.filter((user) => user !== userId);
      await post.save();
      res.json({ success: true, message: "Post unliked" });
    } else {
      post.likes_count.push(userId);
      await post.save();
      res.json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return res.json({
        success: false,
        message: "Comment content is required",
      });
    }

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content: content.trim(),
      parent_comment: parentCommentId || null,
    });

    // Update comments count on post
    await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });

    const populatedComment = await Comment.findById(comment._id).populate(
      "user"
    );

    res.json({
      success: true,
      message: "Comment added",
      comment: populatedComment,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Comments for a Post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId, parent_comment: null })
      .populate("user")
      .sort({ createdAt: -1 });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent_comment: comment._id })
          .populate("user")
          .sort({ createdAt: 1 });
        return { ...comment.toObject(), replies };
      })
    );

    res.json({ success: true, comments: commentsWithReplies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.json({ success: false, message: "Comment not found" });
    }

    if (comment.user !== userId) {
      return res.json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Delete all replies
    const repliesCount = await Comment.countDocuments({
      parent_comment: commentId,
    });
    await Comment.deleteMany({ parent_comment: commentId });
    await Comment.findByIdAndDelete(commentId);

    // Update comments count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { comments_count: -(1 + repliesCount) },
    });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Share Post
export const sharePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content } = req.body;

    const originalPost = await Post.findById(postId);

    if (!originalPost) {
      return res.json({ success: false, message: "Post not found" });
    }

    // Create shared post
    const sharedPost = await Post.create({
      user: userId,
      content: content || "",
      post_type: "shared",
      shared_post: postId,
    });

    // Update original post's share count and shared_by
    originalPost.shares_count += 1;
    if (!originalPost.shared_by.includes(userId)) {
      originalPost.shared_by.push(userId);
    }
    await originalPost.save();

    const populatedPost = await Post.findById(sharedPost._id)
      .populate("user")
      .populate({
        path: "shared_post",
        populate: { path: "user" },
      });

    res.json({
      success: true,
      message: "Post shared successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (post.user !== userId) {
      return res.json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: postId });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update Post
export const updatePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (post.user !== userId) {
      return res.json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    post.content = content;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("user")
      .populate({
        path: "shared_post",
        populate: { path: "user" },
      });

    res.json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
