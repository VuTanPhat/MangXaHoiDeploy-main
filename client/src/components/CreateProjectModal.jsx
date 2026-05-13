import React, { useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useLanguage } from "../context/languageUtils";

const CreateProjectModal = ({ onClose, onProjectCreated }) => {
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const connections = useSelector((state) => state.connections.connections);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    methodology: "scrum",
    start_date: "",
    end_date: "",
    member_ids: [],
  });

  const toggleMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(userId)
        ? prev.member_ids.filter((id) => id !== userId)
        : [...prev.member_ids, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/api/project/create", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(t("projectCreatedSuccess"));
        onProjectCreated();
        onClose();
      } else {
        toast.error(data.message || t("failedToCreateProject"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("failedToCreateProject"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">
            {t("createNewProject")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              {t("projectName")} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              placeholder={t("projectNamePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              {t("projectKey")} * ({t("projectKeyExample")})
            </label>
            <input
              type="text"
              required
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value.toUpperCase() })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white uppercase"
              placeholder="PROJ"
              maxLength={10}
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {t("projectKeyHint")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              {t("description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white h-24 resize-none"
              placeholder={t("projectDescPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              {t("methodology")}
            </label>
            <select
              value={formData.methodology}
              onChange={(e) =>
                setFormData({ ...formData, methodology: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="scrum">Scrum</option>
              <option value="kanban">Kanban</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-white mb-2">
                {t("startDate")}
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white mb-2">
                {t("endDate")}
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              {t("teamMembers")}
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-lg p-3 space-y-2">
              {connections.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t("noConnectionsAvailable")}
                </p>
              ) : (
                connections.map((connection) => (
                  <label
                    key={connection._id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.member_ids.includes(connection._id)}
                      onChange={() => toggleMember(connection._id)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <img
                      src={connection.profile_picture}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm dark:text-white">
                      {connection.full_name} (@{connection.username})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? t("creating") : t("createProject")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
