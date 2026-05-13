import React, { useState, useEffect } from "react";
import {
  Plus,
  FolderKanban,
  Users,
  Calendar,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import CreateProjectModal from "../components/CreateProjectModal";
import { useLanguage } from "../context/languageUtils";

const Projects = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/project/my", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("cannotLoadData"));
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Clock size={14} className="text-green-500" />;
      case "completed":
        return <CheckCircle2 size={14} className="text-blue-500" />;
      default:
        return <Target size={14} className="text-gray-500" />;
    }
  };

  const getMethodologyColor = (methodology) => {
    return methodology === "scrum"
      ? "bg-gradient-to-r from-violet-500 to-purple-500"
      : "bg-gradient-to-r from-cyan-500 to-blue-500";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 dark:text-slate-400 mt-6 font-medium">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                  <FolderKanban size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {t("projects")}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-slate-400 ml-14">
                {t("projectManagement")}
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-medium"
            >
              <Plus size={20} />
              {t("createProject")}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 w-full">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t("searchProjects")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 dark:text-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Stats */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {t("totalProjects")}
              </p>
              <p className="text-2xl font-bold dark:text-white">
                {projects.length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {t("active")}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {projects.filter((p) => p.status === "active").length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Scrum
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {projects.filter((p) => p.methodology === "scrum").length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Kanban
              </p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {projects.filter((p) => p.methodology === "kanban").length}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProjects.length === 0 && !searchQuery ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl">
                <Sparkles size={48} className="text-indigo-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold dark:text-white mb-3">
              {t("noProjects")}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {t("createProjectDescription")}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl font-medium"
            >
              <Plus size={20} />
              {t("createProject")}
              <ArrowRight size={20} />
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Search
              size={48}
              className="mx-auto text-gray-300 dark:text-slate-600 mb-4"
            />
            <h3 className="text-xl font-semibold dark:text-white mb-2">
              {t("noResults")}
            </h3>
            <p className="text-gray-500 dark:text-slate-400">
              {t("tryAdjustingSearch")}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}/board`)}
                className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-1"
              >
                {/* Color Bar */}
                <div
                  className={`h-2 ${getMethodologyColor(project.methodology)}`}
                ></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-mono rounded-lg">
                          {project.key}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          {getStatusIcon(project.status)}
                          <span className="text-xs font-medium text-green-700 dark:text-green-400 capitalize">
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {project.name}
                      </h3>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-5 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                        <Users size={16} />
                        <span className="text-sm font-medium">
                          {project.members?.length || 0}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          project.methodology === "scrum"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                        }`}
                      >
                        {project.methodology}
                      </div>
                    </div>

                    {project.start_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                        <Calendar size={14} />
                        {new Date(project.start_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {filteredProjects.map((project, index) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}/board`)}
                className={`flex items-center gap-6 p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                  index !== filteredProjects.length - 1
                    ? "border-b border-gray-100 dark:border-slate-700"
                    : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${getMethodologyColor(
                    project.methodology
                  )} flex items-center justify-center text-white font-bold shadow-lg`}
                >
                  {project.key.substring(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold dark:text-white truncate">
                      {project.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-xs font-mono rounded">
                      {project.key}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                    <Users size={16} />
                    <span>{project.members?.length || 0}</span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.methodology === "scrum"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                    }`}
                  >
                    {project.methodology}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full">
                    {getStatusIcon(project.status)}
                    <span className="text-xs font-medium text-green-700 dark:text-green-400 capitalize">
                      {project.status}
                    </span>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-gray-300 dark:text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={fetchProjects}
        />
      )}
    </div>
  );
};

export default Projects;
