/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Image,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import moment from "moment";

const PostManagement = () => {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
  });
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [pagination.currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/admin/posts", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.currentPage,
          limit: 10,
          search,
        },
      });

      if (data.success) {
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách bài viết");
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchPosts();
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/admin/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không thể xóa bài viết");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Quản lý bài viết
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý và kiểm duyệt bài viết trong hệ thống
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo nội dung bài viết..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          post.user?.profile_picture || "/default-avatar.png"
                        }
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {post.user?.full_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          @{post.user?.username} •{" "}
                          {moment(post.createdAt).fromNow()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post._id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4">
                  <p className="text-slate-700 dark:text-slate-300 line-clamp-3">
                    {post.content || "(Không có nội dung)"}
                  </p>

                  {/* Images */}
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Image className="w-4 h-4" />
                      <span className="text-sm">
                        {post.image_urls.length} hình ảnh
                      </span>
                    </div>
                  )}
                </div>

                {/* Post Stats */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">
                      {post.likes_count?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">{post.shares_count || 0}</span>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.post_type === "image"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : post.post_type === "shared"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {post.post_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Không tìm thấy bài viết nào
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hiển thị {posts.length} / {pagination.totalPosts} bài viết
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                  disabled={pagination.currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostManagement;
