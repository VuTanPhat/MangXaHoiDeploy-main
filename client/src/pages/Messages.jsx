/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Eye, MessageSquare, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import { useLanguage } from "../context/languageUtils";

// Redux action load groups
import { setGroups } from "../features/groups/groupsSlice";

const Messages = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const { connections } = useSelector((state) => state.connections);
  const { groups } = useSelector((state) => state.groups);

  // STATE popup
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // toggle chọn thành viên
  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/group/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        dispatch(setGroups(data.groups));
      }
    } catch (err) {
      toast.error("Cannot load groups");
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // CREATE GROUP
  const createGroup = async () => {
    try {
      if (!groupName.trim()) return toast.error("Enter group name");
      if (selectedMembers.length === 0)
        return toast.error("Select at least 1 member");

      const token = await getToken();

      const { data } = await api.post(
        "/api/group/create",
        {
          name: groupName,
          member_ids: selectedMembers,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) throw new Error(data.message);

      toast.success("Group created!");

      // Reset form
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedMembers([]);

      // Reload groups
      fetchGroups();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* POPUP CREATE GROUP */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold mb-5 dark:text-white">
              {t("createGroup")}
            </h2>

            {/* Group name */}
            <input
              className="w-full border dark:border-slate-600 px-3 py-2 rounded mb-4 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              placeholder={t("groupName")}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            {/* Member list */}
            <div className="max-h-60 overflow-y-auto border dark:border-slate-600 p-3 rounded mb-4 space-y-2">
              {connections.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center gap-2 dark:text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
                    className="accent-indigo-600"
                  />
                  <img
                    src={user.profile_picture}
                    className="size-8 rounded-full"
                  />
                  <span>{user.full_name}</span>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 border dark:border-slate-600 rounded dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {t("cancel")}
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {t("createGroup")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {t("messages")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {t("talkToFriends")}
            </p>
          </div>

          {/* BUTTON OPEN POPUP */}
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 rounded-lg font-medium shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            <Users size={18} />
            {t("createGroup")}
          </button>
        </div>

        {/* GROUP LIST */}
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          {t("groups")}
        </h2>
        <div className="flex flex-col gap-4 mb-10">
          {groups.map((group) => (
            <div
              key={group._id}
              className="max-w-2xl flex gap-5 p-5 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg dark:shadow-slate-900 rounded-xl cursor-pointer hover:scale-102 transition-all duration-200 border border-gray-100 dark:border-slate-700"
              onClick={() => navigate(`/group/${group._id}`)}
            >
              <div className="flex items-center justify-center size-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md flex-shrink-0">
                <Users size={24} className="text-white" />
              </div>

              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {group.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {group.members.length} {t("members")}
                </p>
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
              {t("noGroups")}
            </p>
          )}
        </div>

        {/* FRIEND LIST */}
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          {t("friends")}
        </h2>
        <div className="flex flex-col gap-4">
          {connections.map((user) => (
            <div
              key={user._id}
              className="max-w-2xl flex gap-5 p-5 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg dark:shadow-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 transition-all duration-200 hover:scale-102"
            >
              <img
                src={user.profile_picture}
                className="rounded-full size-14 shadow-md object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {user.full_name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  @{user.username}
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => navigate(`/messages/${user._id}`)}
                  className="size-11 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 dark:text-indigo-400 text-indigo-600 transition-all hover:shadow-md"
                  title={t("messages")}
                >
                  <MessageSquare size={18} />
                </button>

                <button
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="size-11 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 dark:text-blue-400 text-blue-600 transition-all hover:shadow-md"
                  title={t("profile")}
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
