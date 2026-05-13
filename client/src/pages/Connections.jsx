import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserRoundPen,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { fetchConnections } from "../features/connections/connectionsSlice";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useLanguage } from "../context/languageUtils";

const Connections = () => {
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState("followers");

  const navigate = useNavigate();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const { connections, pendingConnections, followers, following } = useSelector(
    (state) => state.connections
  );

  const dataArray = [
    { key: "followers", label: t("followers"), value: followers, icon: Users },
    {
      key: "following",
      label: t("following"),
      value: following,
      icon: UserCheck,
    },
    {
      key: "pending",
      label: t("pending"),
      value: pendingConnections,
      icon: UserRoundPen,
    },
    {
      key: "connections",
      label: t("connectionsLabel"),
      value: connections,
      icon: UserPlus,
    },
  ];

  const handleUnfollow = async (userId) => {
    try {
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(await getToken()));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const acceptConnection = async (userId) => {
    try {
      const { data } = await api.post(
        "/api/user/accept",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(await getToken()));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchConnections(token));
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t("connections")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t("manageNetwork")}
          </p>
        </div>

        {/* Counts */}
        <div className="mb-8 flex flex-wrap gap-6">
          {dataArray.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow dark:shadow-slate-900 rounded-md"
            >
              <b className="dark:text-white">{item.value.length}</b>
              <p className="text-slate-600 dark:text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap items-center border border-gray-200 dark:border-slate-700 rounded-md p-1 bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-900">
          {dataArray.map((tab) => (
            <button
              onClick={() => setCurrentTab(tab.key)}
              key={tab.key}
              className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                currentTab === tab.key
                  ? "bg-white dark:bg-slate-700 font-medium text-black dark:text-white"
                  : "text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="ml-1">{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Connections */}
        <div className="flex flex-wrap gap-6 mt-6">
          {dataArray
            .find((item) => item.key === currentTab)
            .value.map((user) => (
              <div
                key={user._id}
                className="w-full max-w-88 flex gap-5 p-6 bg-white dark:bg-slate-800 shadow dark:shadow-slate-900 rounded-md "
              >
                <img
                  src={user.profile_picture}
                  alt=""
                  className="rounded-full w-12 h-12 shadow-md mx-auto"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {user.full_name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    @{user.username}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {user.bio.slice(0, 30)}...
                  </p>
                  <div className="flex max-sm:flex-col gap-2 mt-4">
                    {
                      <button
                        onClick={() => navigate(`/profile/${user._id}`)}
                        className="w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer"
                      >
                        {t("viewProfile")}
                      </button>
                    }
                    {currentTab === "following" && (
                      <button
                        onClick={() => handleUnfollow(user._id)}
                        className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer"
                      >
                        {t("unfollow")}
                      </button>
                    )}
                    {currentTab === "pending" && (
                      <button
                        onClick={() => acceptConnection(user._id)}
                        className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer"
                      >
                        {t("accept")}
                      </button>
                    )}
                    {currentTab === "connections" && (
                      <button
                        onClick={() => navigate(`/messages/${user._id}`)}
                        className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {t("message")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;
