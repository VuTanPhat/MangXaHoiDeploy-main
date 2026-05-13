import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Share2,
  Clock,
  User,
  Flag,
  Tag,
  CheckCircle2,
  Timer,
  TrendingUp,
  BookOpen,
  CheckSquare,
  Bug,
  Zap,
  MoreHorizontal,
  Play,
  Pause,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import TaskHandoverModal from "../components/TaskHandoverModal";
import moment from "moment";
import { useLanguage } from "../context/languageUtils";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const currentUser = useSelector((state) => state.user.value);
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [timeLogForm, setTimeLogForm] = useState({
    hours: "",
    description: "",
  });

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/task/${taskId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setTask(data.task);
        setTimeLogs(data.timeLogs || []);
        if (data.task.project) {
          fetchProject(data.task.project._id);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t("failedToLoadTask"));
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async (projectId) => {
    try {
      const { data } = await api.get(`/api/project/${projectId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setProject(data.project);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(
        `/api/task/${taskId}/time-log`,
        timeLogForm,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(t("timeLoggedSuccessfully"));
        setTimeLogForm({ hours: "", description: "" });
        fetchTask();
      }
    } catch (err) {
      console.error(err);
      toast.error(t("failedToLogTime"));
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await api.put(
        `/api/task/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setTask(data.task);
        toast.success(t("statusUpdated"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("failedToUpdateStatus"));
    }
  };

  const priorityConfig = {
    critical: {
      color: "text-red-500",
      bg: "bg-red-100 dark:bg-red-900/30",
      label: t("critical"),
    },
    high: {
      color: "text-orange-500",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      label: t("high"),
    },
    medium: {
      color: "text-yellow-500",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      label: t("medium"),
    },
    low: {
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      label: t("low"),
    },
    lowest: {
      color: "text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-900/30",
      label: t("lowest"),
    },
  };

  const statusConfig = {
    backlog: {
      color: "text-slate-600",
      bg: "bg-slate-100 dark:bg-slate-800",
      gradient: "from-slate-500 to-slate-600",
    },
    todo: {
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      gradient: "from-blue-500 to-blue-600",
    },
    in_progress: {
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      gradient: "from-amber-500 to-orange-500",
    },
    in_review: {
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      gradient: "from-purple-500 to-violet-600",
    },
    testing: {
      color: "text-pink-600",
      bg: "bg-pink-100 dark:bg-pink-900/30",
      gradient: "from-pink-500 to-rose-500",
    },
    done: {
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      gradient: "from-emerald-500 to-green-600",
    },
    blocked: {
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
      gradient: "from-red-500 to-red-600",
    },
  };

  const typeConfig = {
    story: {
      icon: BookOpen,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    task: {
      icon: CheckSquare,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    bug: {
      icon: Bug,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    epic: {
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <CheckSquare
              size={28}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500"
            />
          </div>
          <p className="text-gray-500 dark:text-slate-400 mt-6 font-medium">
            {t("loadingTask")}
          </p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-block mb-4">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">
            {t("taskNotFound")}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            {t("taskNotFoundDesc")}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  const isAssignee = task.assignee?._id === currentUser?._id;
  const TypeIcon = typeConfig[task.type]?.icon || CheckSquare;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.backlog;
  const typeStyle = typeConfig[task.type] || typeConfig.task;
  const timeProgress =
    task.estimated_hours > 0
      ? Math.min((task.actual_hours / task.estimated_hours) * 100, 100)
      : 0;
  const isOvertime = task.actual_hours > task.estimated_hours;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("back")}</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <Edit size={18} className="text-gray-500 dark:text-slate-400" />
            </button>
            <button className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors text-red-500">
              <Trash2 size={18} />
            </button>
            <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <MoreHorizontal
                size={18}
                className="text-gray-500 dark:text-slate-400"
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${typeStyle.bg}`}>
                  <TypeIcon size={24} className={typeStyle.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-mono rounded-lg">
                      {task.task_key}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-lg ${status.bg} ${status.color}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-lg ${priority.bg} ${priority.color}`}
                    >
                      <Flag size={14} />
                      {priority.label}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold dark:text-white mb-3">
                    {task.title}
                  </h1>
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-300 rounded-full font-medium"
                        >
                          <Tag size={12} />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold dark:text-white mb-3">
                  <BookOpen size={16} className="text-gray-400" />
                  {t("description")}
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                  <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {task.description || t("noDescriptionProvided")}
                  </p>
                </div>
              </div>

              {isAssignee && (
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => setShowHandoverModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 font-medium"
                  >
                    <Share2 size={18} />
                    {t("handoverTask")}
                  </button>
                </div>
              )}
            </div>

            {/* Time Tracking Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="flex items-center gap-2 text-lg font-semibold dark:text-white mb-6">
                <Timer size={20} className="text-indigo-500" />
                {t("timeTracking")}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">
                    {t("estimated")}
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {task.estimated_hours || 0}
                    <span className="text-lg font-normal">h</span>
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl ${
                    isOvertime
                      ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20"
                      : "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 font-medium ${
                      isOvertime
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {t("actual")}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      isOvertime
                        ? "text-red-700 dark:text-red-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {task.actual_hours || 0}
                    <span className="text-lg font-normal">h</span>
                  </p>
                </div>
              </div>

              {task.estimated_hours > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-slate-400">
                      {t("progress")}
                    </span>
                    <span
                      className={`font-medium ${
                        isOvertime ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {Math.round(timeProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOvertime
                          ? "bg-gradient-to-r from-red-500 to-orange-500"
                          : "bg-gradient-to-r from-emerald-500 to-green-500"
                      }`}
                      style={{ width: `${Math.min(timeProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogTime} className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={timeLogForm.hours}
                    onChange={(e) =>
                      setTimeLogForm({ ...timeLogForm, hours: e.target.value })
                    }
                    placeholder={t("hours")}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
                  >
                    <Play size={18} />
                  </button>
                </div>
                <input
                  type="text"
                  value={timeLogForm.description}
                  onChange={(e) =>
                    setTimeLogForm({
                      ...timeLogForm,
                      description: e.target.value,
                    })
                  }
                  placeholder={t("whatDidYouWorkOn")}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </form>

              {timeLogs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold dark:text-white mb-3">
                    {t("recentActivity")}
                  </h4>
                  <div className="space-y-2">
                    {timeLogs.slice(0, 5).map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={log.user.profile_picture}
                            alt=""
                            className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-800"
                          />
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {log.hours}h
                            </span>
                            <span className="text-gray-500 dark:text-slate-400 ml-2">
                              {log.description || t("noDescription")}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                          {moment(log.date).fromNow()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white mb-6">
                {t("details")}
              </h3>

              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 font-medium">
                    {t("status")}
                  </p>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full px-4 py-2.5 border-0 rounded-xl font-medium ${status.bg} ${status.color} focus:ring-2 focus:ring-indigo-500 cursor-pointer`}
                  >
                    <option value="backlog">{t("backlog")}</option>
                    <option value="todo">{t("todo")}</option>
                    <option value="in_progress">{t("inProgress")}</option>
                    <option value="in_review">{t("inReview")}</option>
                    <option value="testing">{t("testing")}</option>
                    <option value="done">{t("done")}</option>
                    <option value="blocked">{t("blocked")}</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 font-medium">
                    {t("assignee")}
                  </p>
                  {task.assignee ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="relative">
                        <img
                          src={task.assignee.profile_picture}
                          alt=""
                          className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-800"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-800"></div>
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">
                          {task.assignee.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          @{task.assignee.username}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                      <span className="text-gray-500 dark:text-slate-400">
                        {t("unassigned")}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 font-medium">
                    {t("reporter")}
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                    <img
                      src={task.reporter.profile_picture}
                      alt=""
                      className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-800"
                    />
                    <div>
                      <p className="font-medium dark:text-white">
                        {task.reporter.full_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        @{task.reporter.username}
                      </p>
                    </div>
                  </div>
                </div>

                {task.story_points && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 font-medium">
                      {t("storyPoints")}
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                      <TrendingUp size={18} className="text-indigo-500" />
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {task.story_points} SP
                      </span>
                    </div>
                  </div>
                )}

                {task.due_date && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 font-medium">
                      {t("dueDate")}
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                      <Calendar size={18} className="text-gray-500" />
                      <span className="font-medium dark:text-white">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 font-medium">
                    {t("created")}
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                    <Clock size={18} className="text-gray-500" />
                    <span className="font-medium dark:text-white">
                      {moment(task.createdAt).format("MMM DD, YYYY")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blocked Alert */}
            {task.status === "blocked" && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 text-red-700 dark:text-red-400 mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <AlertTriangle size={20} />
                  </div>
                  <h4 className="font-bold">{t("taskBlocked")}</h4>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {t("taskBlockedDesc")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHandoverModal && project && (
        <TaskHandoverModal
          task={task}
          projectMembers={project.members}
          onClose={() => setShowHandoverModal(false)}
          onHandoverCreated={fetchTask}
        />
      )}
    </div>
  );
};

export default TaskDetail;
