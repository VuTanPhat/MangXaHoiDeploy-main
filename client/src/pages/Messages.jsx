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
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950">
      {/* POPUP CREATE GROUP */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t("messages")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t("talkToFriends")}
            </p>
          </div>

          {/* BUTTON OPEN POPUP */}
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 active:scale-95"
          >
            <Users size={18} />
            {t("createGroup")}
          </button>
        </div>

        {/* GROUP LIST */}
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {t("groups")}
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          {groups.map((group) => (
            <div
              key={group._id}
              className="max-w-xl flex gap-5 p-6 bg-white dark:bg-slate-800 shadow dark:shadow-slate-900 rounded-md cursor-pointer hover:shadow-lg dark:hover:bg-slate-700 transition"
              onClick={() => navigate(`/group/${group._id}`)}
            >
              <img
                src={
                  group.avatar ||
                  "https://cdn-icons-png.flaticon.com/512/711/711245.png"
                }
                className="rounded-full size-12"
              />

              <div className="flex-1">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {group.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {group.members.length} {t("members")}
                </p>
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t("noGroups")}
            </p>
          )}
        </div>

        {/* FRIEND LIST */}
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {t("friends")}
        </h2>
        <div className="flex flex-col gap-3">
          {connections.map((user) => (
            <div
              key={user._id}
              className="max-w-xl flex gap-5 p-6 bg-white dark:bg-slate-800 shadow dark:shadow-slate-900 rounded-md"
            >
              <img
                src={user.profile_picture}
                className="rounded-full size-12"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {user.full_name}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  @{user.username}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={() => navigate(`/messages/${user._id}`)}
                  className="size-10 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-slate-300"
                >
                  <MessageSquare size={18} />
                </button>

                <button
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="size-10 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-slate-300"
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
