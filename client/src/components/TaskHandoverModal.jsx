import React, { useState } from "react";
import { X, Users, FileText, AlertTriangle, Calendar } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useLanguage } from "../context/languageUtils";

const TaskHandoverModal = ({
  task,
  projectMembers,
  onClose,
  onHandoverCreated,
}) => {
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to_user: "",
    reason: "",
    context: "",
    completed_work: "",
    pending_work: "",
    blockers: "",
    schedule_meeting: false,
    meeting_date: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post(
        `/api/task/${task._id}/handover`,
        formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(t("handoverRequestSent"));
        onHandoverCreated();
        onClose();
      } else {
        toast.error(data.message || t("failedToCreateHandover"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("failedToCreateHandover"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">
              {t("taskHandover")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {task.task_key}: {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              <Users size={16} className="inline mr-2" />
              {t("handoverToRequired")}
            </label>
            <select
              required
              value={formData.to_user}
              onChange={(e) =>
                setFormData({ ...formData, to_user: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">{t("selectTeamMember")}</option>
              {projectMembers?.map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.full_name} (@{member.user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              {t("reasonForHandover")}
            </label>
            <select
              required
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">{t("selectReason")}</option>
              <option value="vacation">{t("vacationLeave")}</option>
              <option value="workload">{t("workloadBalancing")}</option>
              <option value="expertise">{t("betterExpertiseMatch")}</option>
              <option value="priority">{t("priorityChange")}</option>
              <option value="other">{t("other")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              <FileText size={16} className="inline mr-2" />
              {t("contextBackground")}
            </label>
            <textarea
              value={formData.context}
              onChange={(e) =>
                setFormData({ ...formData, context: e.target.value })
              }
              placeholder={t("provideImportantContext")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              ✅ {t("workCompletedSoFar")}
            </label>
            <textarea
              value={formData.completed_work}
              onChange={(e) =>
                setFormData({ ...formData, completed_work: e.target.value })
              }
              placeholder={t("whatHasBeenDone")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              📋 {t("pendingWork")}
            </label>
            <textarea
              value={formData.pending_work}
              onChange={(e) =>
                setFormData({ ...formData, pending_work: e.target.value })
              }
              placeholder={t("whatNeedsToBeDone")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-white mb-2">
              <AlertTriangle size={16} className="inline mr-2 text-red-500" />
              {t("currentBlockersIssues")}
            </label>
            <textarea
              value={formData.blockers}
              onChange={(e) =>
                setFormData({ ...formData, blockers: e.target.value })
              }
              placeholder={t("anyBlockersIssues")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white h-24 resize-none"
            />
          </div>

          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.schedule_meeting}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule_meeting: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium dark:text-white">
                <Calendar size={16} className="inline mr-2" />
                {t("scheduleHandoverMeeting")}
              </span>
            </label>

            {formData.schedule_meeting && (
              <input
                type="datetime-local"
                value={formData.meeting_date}
                onChange={(e) =>
                  setFormData({ ...formData, meeting_date: e.target.value })
                }
                className="mt-3 w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              />
            )}
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
              {loading ? t("loading") : t("sendHandoverRequest")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskHandoverModal;
