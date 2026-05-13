/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Users,
  FileText,
  MessageSquare,
  UsersRound,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/languageUtils";

const Dashboard = () => {
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(t("cannotLoadData"));
    }
    setLoading(false);
  };

  const statCards = stats
    ? [
        {
          title: t("totalUsers"),
          value: stats.totalUsers,
          icon: Users,
          color: "bg-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
          title: t("totalPosts"),
          value: stats.totalPosts,
          icon: FileText,
          color: "bg-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
        },
        {
          title: t("totalMessages"),
          value: stats.totalMessages,
          icon: MessageSquare,
          color: "bg-purple-500",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
        },
        {
          title: t("totalGroups"),
          value: stats.totalGroups,
          icon: UsersRound,
          color: "bg-orange-500",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
        },
        {
          title: t("active"),
          value: stats.activeUsers,
          icon: UserCheck,
          color: "bg-emerald-500",
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        },
        {
          title: t("banned"),
          value: stats.blockedUsers,
          icon: UserX,
          color: "bg-red-500",
          bgColor: "bg-red-50 dark:bg-red-900/20",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          {t("dashboard")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t("systemOverview")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl p-6 border border-slate-200 dark:border-slate-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`${card.color} p-4 rounded-xl`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {t("newUsersThisWeek")}
            </h3>
          </div>
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            +{stats?.newUsersThisWeek || 0}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {t("inLast7Days")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {t("newPostsThisWeek")}
            </h3>
          </div>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            +{stats?.newPostsThisWeek || 0}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {t("inLast7Days")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
