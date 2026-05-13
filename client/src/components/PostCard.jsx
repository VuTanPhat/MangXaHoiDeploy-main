/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  Send,
  X,
  Trash2,
  Repeat2,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useLanguage } from "../context/languageUtils";

const PostCard = ({ post, onPostShared, onPostDeleted, onPostUpdated }) => {
  const postWithHashtags = post.content
    ? post.content.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')
    : "";
  const [likes, setLikes] = useState(post.likes_count || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [sharesCount, setSharesCount] = useState(post.shares_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [sharing, setSharing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { t } = useLanguage();
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Determine if this is a shared post
  const isSharedPost = post.post_type === "shared" && post.shared_post;
  const originalPost = isSharedPost ? post.shared_post : null;

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setLikes((prev) => {
          if (prev.includes(currentUser._id)) {
            return prev.filter((id) => id !== currentUser._id);
          } else {
            return [...prev, currentUser._id];
          }
        });
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/api/post/comments/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      toast.error("Failed to load comments");
    }
    setLoadingComments(false);
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { data } = await api.post(
        `/api/post/comment`,
        { postId: post._id, content: newComment },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
        setCommentsCount((prev) => prev + 1);
        setNewComment("");
        toast.success("Comment added");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const { data } = await api.delete(`/api/post/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        const deletedComment = comments.find((c) => c._id === commentId);
        const repliesCount = deletedComment?.replies?.length || 0;
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setCommentsCount((prev) => prev - 1 - repliesCount);
        toast.success("Comment deleted");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  // Share post
  const handleShare = async () => {
    setSharing(true);
    try {
      const postToShare = isSharedPost ? originalPost._id : post._id;
      const { data } = await api.post(
        `/api/post/share`,
        { postId: postToShare, content: shareContent },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setSharesCount((prev) => prev + 1);
        setShowShareModal(false);
        setShareContent("");
        toast.success("Post shared to your profile!");
        if (onPostShared) onPostShared(data.post);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to share post");
    }
    setSharing(false);
  };

  // Toggle comments section
  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    setDeleting(true);
    try {
      const { data } = await api.delete(`/api/post/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success("Đã xóa bài viết");
        if (onPostDeleted) onPostDeleted(post._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không thể xóa bài viết");
    }
    setDeleting(false);
    setShowMenu(false);
  };

  // Update post
  const handleUpdatePost = async () => {
    if (!editContent.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }

    setUpdating(true);
    try {
      const { data } = await api.put(
        `/api/post/${post._id}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success("Đã cập nhật bài viết");
        setShowEditModal(false);
        if (onPostUpdated) onPostUpdated(data.post);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không thể cập nhật bài viết");
    }
    setUpdating(false);
  };

  // Render original post content (for shared posts)
  const renderOriginalPost = () => {
    if (!originalPost) return null;

    const originalHashtags = originalPost.content
      ? originalPost.content.replace(
          /(#\w+)/g,
          '<span class="text-indigo-600">$1</span>'
        )
      : "";

    return (
      <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 mt-2">
        <div
          onClick={() => navigate("/profile/" + originalPost.user._id)}
          className="inline-flex items-center gap-2 cursor-pointer mb-2"
        >
          <img
            src={originalPost.user.profile_picture}
            alt=""
            className="w-8 h-8 rounded-full shadow"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-sm dark:text-white">
                {originalPost.user.full_name}
              </span>
              <BadgeCheck className="w-3 h-3 text-blue-500" />
            </div>
            <div className="text-gray-500 dark:text-slate-400 text-xs">
              @{originalPost.user.username} •{" "}
              {moment(originalPost.createdAt).fromNow()}
            </div>
          </div>
        </div>

        {originalPost.content && (
          <div
            className="text-gray-800 dark:text-slate-200 text-sm whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: originalHashtags }}
          />
        )}

        {originalPost.image_urls && originalPost.image_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {originalPost.image_urls.map((img, index) => (
              <img
                src={img}
                key={index}
                className={`w-full h-32 object-cover rounded-lg ${
                  originalPost.image_urls.length === 1 && "col-span-2 h-auto"
                }`}
                alt=""
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow dark:shadow-slate-900 p-4 space-y-4 w-full max-w-2xl">
      {/* Shared indicator */}
      {isSharedPost && (
        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-xs pb-2 border-b border-gray-200 dark:border-slate-600">
          <Repeat2 className="w-4 h-4" />
          <span>
            {post.user.full_name} {t("sharedAPost")}
          </span>
        </div>
      )}

      {/* User Info */}
      <div className="flex items-center justify-between">
        <div
          onClick={() => navigate("/profile/" + post.user._id)}
          className="inline-flex items-center gap-3 cursor-pointer"
        >
          <img
            src={post.user.profile_picture}
            alt=""
            className="w-10 h-10 rounded-full shadow"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="dark:text-white">{post.user.full_name}</span>
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-gray-500 dark:text-slate-400 text-sm">
              @{post.user.username} • {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>

        {/* Post Menu - only for post owner */}
        {post.user._id === currentUser._id && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-t-lg"
                >
                  <Pencil className="w-4 h-4" />
                  {t("edit")}
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? t("deleting") : t("deletePost")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div
          className="text-gray-800 dark:text-slate-200 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {/* Shared Post Content */}
      {isSharedPost && renderOriginalPost()}

      {/* Images (only for non-shared posts) */}
      {!isSharedPost && post.image_urls && post.image_urls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.map((img, index) => (
            <img
              src={img}
              key={index}
              className={`w-full h-48 object-cover rounded-lg ${
                post.image_urls.length === 1 && "col-span-2 h-auto"
              }`}
              alt=""
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-600 dark:text-slate-400 text-sm pt-2 border-t border-gray-300 dark:border-slate-600">
        <div className="flex items-center gap-1">
          <Heart
            className={`w-4 h-4 cursor-pointer hover:scale-110 transition ${
              likes.includes(currentUser._id) && "text-red-500 fill-red-500"
            }`}
            onClick={handleLike}
          />
          <span>{likes.length}</span>
        </div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-indigo-500 transition"
          onClick={handleToggleComments}
        >
          <MessageCircle
            className={`w-4 h-4 ${showComments && "text-indigo-500"}`}
          />
          <span>{commentsCount}</span>
        </div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-green-500 transition"
          onClick={() => setShowShareModal(true)}
        >
          <Share2 className="w-4 h-4" />
          <span>{sharesCount}</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="pt-3 border-t border-gray-200 dark:border-slate-600 space-y-3">
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <img
              src={currentUser.profile_picture}
              alt=""
              className="w-8 h-8 rounded-full shadow"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("writeComment")}
                className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full px-4 py-2 text-sm outline-none dark:text-white"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center text-gray-500 text-sm py-2">
              {t("loadingComments")}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-2">
              {t("noComments")}
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-2">
                  <img
                    src={comment.user.profile_picture}
                    alt=""
                    className="w-8 h-8 rounded-full shadow cursor-pointer"
                    onClick={() => navigate("/profile/" + comment.user._id)}
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-medium dark:text-white cursor-pointer hover:underline"
                          onClick={() =>
                            navigate("/profile/" + comment.user._id)
                          }
                        >
                          {comment.user.full_name}
                        </span>
                        {comment.user._id === currentUser._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300">
                        {comment.content}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {moment(comment.createdAt).fromNow()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">
                {t("sharePost")}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              placeholder={t("addShareComment")}
              className="w-full bg-gray-100 dark:bg-slate-700 rounded-lg p-3 text-sm outline-none resize-none h-20 dark:text-white"
            />

            {/* Preview of post being shared */}
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={
                    isSharedPost
                      ? originalPost.user.profile_picture
                      : post.user.profile_picture
                  }
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium dark:text-white">
                  {isSharedPost
                    ? originalPost.user.full_name
                    : post.user.full_name}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-3">
                {isSharedPost ? originalPost.content : post.content}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {sharing ? t("sharing") : t("shareToProfile")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">
                {t("editPost")}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder={t("postContent")}
              className="w-full bg-gray-100 dark:bg-slate-700 rounded-lg p-3 text-sm outline-none resize-none h-32 dark:text-white"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={updating}
                className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {updating ? t("saving") : t("saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
