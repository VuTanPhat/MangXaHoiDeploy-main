import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Users,
  Calendar,
  FolderKanban,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const ProjectManagement = () => {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/project/all", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const { data } = await api.delete(`/api/project/admin/${projectId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Project deleted successfully");
        setDeleteConfirm(null);
        fetchProjects();
      } else {
        toast.error(data.message || "Failed to delete project");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project");
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.owner?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const getMethodologyColor = (methodology) => {
    return methodology === "scrum"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FolderKanban
              size={24}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Quản lý dự án
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 ml-12">
          Quản lý tất cả các dự án trên hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tổng dự án
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {projects.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Đang hoạt động
          </p>
          <p className="text-2xl font-bold text-green-600">
            {projects.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Scrum</p>
          <p className="text-2xl font-bold text-purple-600">
            {projects.filter((p) => p.methodology === "scrum").length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Kanban</p>
          <p className="text-2xl font-bold text-cyan-600">
            {projects.filter((p) => p.methodology === "kanban").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderKanban
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400">
              Không có dự án nào
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Dự án
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Chủ sở hữu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Phương pháp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Thành viên
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredProjects.map((project) => (
                <tr
                  key={project._id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {project.key.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {project.key}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={project.owner?.profile_picture}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {project.owner?.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getMethodologyColor(
                        project.methodology
                      )}`}
                    >
                      {project.methodology}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Users size={16} />
                      <span>{project.members?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <Calendar size={14} />
                      {new Date(project.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/project/${project._id}/board`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <ExternalLink size={16} className="text-slate-500" />
                      </a>
                      <button
                        onClick={() => setDeleteConfirm(project._id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Xóa dự án?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Hành động này sẽ xóa vĩnh viễn dự án và tất cả các task liên quan.
              Không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Xóa dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
