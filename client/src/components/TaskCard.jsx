import React from "react";
import {
  Clock,
  AlertCircle,
  BookOpen,
  CheckSquare,
  Bug,
  Zap,
  Flag,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TaskCard = ({ task }) => {
  const navigate = useNavigate();

  const priorityConfig = {
    critical: {
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-l-red-500",
    },
    high: {
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-l-orange-500",
    },
    medium: {
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-l-yellow-500",
    },
    low: {
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-l-blue-500",
    },
    lowest: {
      color: "text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-900/20",
      border: "border-l-gray-400",
    },
  };

  const typeConfig = {
    story: {
      icon: BookOpen,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    task: {
      icon: CheckSquare,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    bug: {
      icon: Bug,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    epic: {
      icon: Zap,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  };

  const TypeIcon = typeConfig[task.type]?.icon || CheckSquare;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const typeStyle = typeConfig[task.type] || typeConfig.task;

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "done";

  return (
    <div
      onClick={() => navigate(`/task/${task._id}`)}
      className={`group bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 border-l-4 ${priority.border}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${typeStyle.bg}`}>
            <TypeIcon size={14} className={typeStyle.color} />
          </div>
          <span className="text-xs font-mono text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
            {task.task_key}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flag size={12} className={priority.color} />
          {task.status === "blocked" && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400">
              <AlertCircle size={12} />
              <span className="text-xs font-medium">Blocked</span>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.labels.slice(0, 3).map((label, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-300 rounded-full font-medium"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="relative">
              <img
                src={task.assignee.profile_picture}
                alt={task.assignee.full_name}
                className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-800"
                title={task.assignee.full_name}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-800"></div>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
              <span className="text-xs text-gray-400">?</span>
            </div>
          )}
          {task.story_points && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">
              {task.story_points} SP
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.due_date && (
            <div
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                isOverdue
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
              }`}
            >
              <Clock size={12} />
              {new Date(task.due_date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
