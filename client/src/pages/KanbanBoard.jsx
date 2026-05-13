import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  Filter,
  ArrowLeft,
  LayoutGrid,
  Users,
  Search,
  MoreHorizontal,
  Inbox,
  Circle,
  Loader,
  Eye,
  FlaskConical,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import { useLanguage } from "../context/languageUtils";

const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const columns = [
    {
      id: "backlog",
      title: t("backlog"),
      icon: Inbox,
      gradient: "from-slate-500 to-slate-600",
      bgLight: "bg-slate-50 dark:bg-slate-900/50",
    },
    {
      id: "todo",
      title: t("todo"),
      icon: Circle,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "in_progress",
      title: t("inProgress"),
      icon: Loader,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      id: "in_review",
      title: t("inReview"),
      icon: Eye,
      gradient: "from-purple-500 to-violet-600",
      bgLight: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "testing",
      title: t("testing"),
      icon: FlaskConical,
      gradient: "from-pink-500 to-rose-500",
      bgLight: "bg-pink-50 dark:bg-pink-900/20",
    },
    {
      id: "done",
      title: t("done"),
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-green-600",
      bgLight: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      await fetchProject();
      await fetchTasks();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProject = async () => {
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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/task/project/${projectId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const taskId = draggableId;
    const newStatus = destination.droppableId;

    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      await api.put(
        `/api/task/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      toast.success("Task status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task");
      fetchTasks();
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(
      (task) =>
        task.status === status &&
        (searchQuery === "" ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.task_key.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <LayoutGrid
              size={28}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500"
            />
          </div>
          <p className="text-gray-500 dark:text-slate-400 mt-6 font-medium">
            Loading board...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col overflow-hidden">
      {/* Header - Fixed, không scroll theo columns */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/projects")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft
                size={20}
                className="text-gray-600 dark:text-slate-400"
              />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold dark:text-white">
                  {project?.name || "Kanban Board"}
                </h1>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs font-mono rounded">
                  {project?.key}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{project?.members?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <span>
                    {completedTasks}/{totalTasks}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white text-sm">
              <Filter size={14} />
              <span>Filter</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board - Columns scroll horizontally */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden p-4 flex-1 min-h-0">
          {columns.map((column) => {
            const ColumnIcon = column.icon;
            const columnTasks = getTasksByStatus(column.id);

            return (
              <div key={column.id} className="flex-shrink-0 w-64 flex flex-col">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
                  {/* Column Header */}
                  <div className="p-3 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg bg-gradient-to-br ${column.gradient}`}
                        >
                          <ColumnIcon size={14} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold dark:text-white">
                            {column.title}
                          </h3>
                          <p className="text-xs text-gray-400 dark:text-slate-500">
                            {columnTasks.length} tasks
                          </p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">
                        <MoreHorizontal size={14} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 flex-1 overflow-y-auto transition-colors ${
                          snapshot.isDraggingOver
                            ? column.bgLight
                            : "bg-gray-50/50 dark:bg-slate-900/30"
                        }`}
                      >
                        {columnTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div
                              className={`p-3 rounded-full ${column.bgLight} mb-3`}
                            >
                              <ColumnIcon
                                size={24}
                                className="text-gray-400 dark:text-slate-500"
                              />
                            </div>
                            <p className="text-sm text-gray-400 dark:text-slate-500">
                              No tasks
                            </p>
                            <p className="text-xs text-gray-300 dark:text-slate-600">
                              Drag tasks here
                            </p>
                          </div>
                        ) : (
                          columnTasks.map((task, index) => (
                            <Draggable
                              key={task._id}
                              draggableId={task._id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-3 transition-all ${
                                    snapshot.isDragging
                                      ? "rotate-2 scale-105 shadow-2xl"
                                      : ""
                                  }`}
                                >
                                  <TaskCard task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={fetchTasks}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
