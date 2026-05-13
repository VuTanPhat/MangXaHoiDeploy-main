/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { dummyRecentMessagesData } from "../assets/assets";
import { Link } from "react-router-dom";
import moment from "moment";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { MessageCircle, Users } from "lucide-react";
import { useLanguage } from "../context/languageUtils";

const RecentMessages = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "groups"
  const { user } = useUser();
  const { getToken, userId } = useAuth();

  // Fetch tin nhắn cá nhân
  const fetchRecentMessages = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/recent-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        // Group messages by conversation partner (không phải mình)
        const groupedMessages = data.messages.reduce((acc, message) => {
          // Xác định người chat cùng (không phải mình)
          const partnerId =
            message.from_user_id._id === userId
              ? message.to_user_id
              : message.from_user_id._id;

          // Lấy thông tin partner
          const partnerInfo =
            message.from_user_id._id === userId
              ? null // Tin nhắn mình gửi, cần lấy to_user info từ nơi khác
              : message.from_user_id;

          if (
            !acc[partnerId] ||
            new Date(message.createdAt) > new Date(acc[partnerId].createdAt)
          ) {
            acc[partnerId] = {
              ...message,
              partnerId: partnerId,
              partnerInfo: partnerInfo,
              isFromMe: message.from_user_id._id === userId,
            };
          }
          return acc;
        }, {});

        // Sort messages by date
        const sortedMessages = Object.values(groupedMessages)
          .filter((msg) => msg.partnerInfo) // Chỉ lấy tin nhắn có thông tin partner
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Fetch tin nhắn group
  const fetchGroupMessages = async () => {
    try {
      const token = await getToken();

      // Lấy danh sách groups
      const { data: groupsData } = await api.get("/api/group/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!groupsData.success) return;

      // Lấy tin nhắn mới nhất của mỗi group
      const groupMessagesPromises = groupsData.groups.map(async (group) => {
        try {
          const { data: messagesData } = await api.post(
            "/api/group/messages",
            { group_id: group._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (messagesData.success && messagesData.messages.length > 0) {
            const lastMessage =
              messagesData.messages[messagesData.messages.length - 1];
            return {
              ...lastMessage,
              group: group,
              isGroupMessage: true,
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(groupMessagesPromises);
      const validGroupMessages = results
        .filter((msg) => msg !== null)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setGroupMessages(validGroupMessages);
    } catch (error) {
      console.error("Error fetching group messages:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      fetchGroupMessages();

      const interval = setInterval(() => {
        fetchRecentMessages();
        fetchGroupMessages();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Helper để lấy sender info
  const getSenderInfo = (msg) => {
    if (typeof msg.from_user_id === "object" && msg.from_user_id !== null) {
      return msg.from_user_id;
    }
    return { _id: msg.from_user_id, full_name: "User", profile_picture: "" };
  };

  return (
    <div className="bg-white dark:bg-slate-800 max-w-xs mt-4 p-4 min-h-20 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
      {/* Header với tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeTab === "personal"
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
              : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {t("personal")}
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeTab === "groups"
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
              : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          {t("groups")}
        </button>
      </div>

      {/* Tin nhắn cá nhân */}
      {activeTab === "personal" && (
        <div className="flex flex-col max-h-64 overflow-y-auto no-scrollbar">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-slate-500 py-4">
              {t("noMessages")}
            </p>
          ) : (
            messages.map((message, index) => {
              const isUnread = !message.seen && !message.isFromMe;
              return (
                <Link
                  to={`/messages/${message.partnerId}`}
                  key={index}
                  className={`flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                    isUnread
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-3 border-indigo-500"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={message.partnerInfo?.profile_picture}
                      alt=""
                      className={`w-9 h-9 rounded-full object-cover ${
                        isUnread ? "ring-2 ring-indigo-500" : ""
                      }`}
                    />
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p
                        className={`truncate ${
                          isUnread
                            ? "font-bold text-gray-900 dark:text-white"
                            : "font-medium text-gray-800 dark:text-slate-200"
                        }`}
                      >
                        {message.partnerInfo?.full_name}
                        {isUnread && (
                          <span className="ml-1.5 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            {t("new")}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                        {moment(message.createdAt).fromNow()}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p
                        className={`truncate ${
                          isUnread
                            ? "text-gray-800 dark:text-slate-200 font-semibold"
                            : "text-gray-500 dark:text-slate-400"
                        }`}
                      >
                        {message.isFromMe && (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {t("you")}:{" "}
                          </span>
                        )}
                        {message.text ? message.text : `📷 ${t("image")}`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Tin nhắn nhóm */}
      {activeTab === "groups" && (
        <div className="flex flex-col max-h-64 overflow-y-auto no-scrollbar">
          {groupMessages.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-slate-500 py-4">
              {t("noGroupMessages")}
            </p>
          ) : (
            groupMessages.map((message, index) => {
              const senderInfo = getSenderInfo(message);
              const isMe = senderInfo._id === userId;
              // Tin nhắn chưa đọc: không phải mình gửi và chưa seen
              const isUnread = !isMe && !message.seen;

              return (
                <Link
                  to={`/group/${message.group._id}`}
                  key={index}
                  className={`flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                    isUnread
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-3 border-indigo-500"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={
                        message.group.avatar ||
                        "https://cdn-icons-png.flaticon.com/512/711/711245.png"
                      }
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    {isUnread ? (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Users className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p
                        className={`truncate ${
                          isUnread
                            ? "font-bold text-gray-900 dark:text-white"
                            : "font-medium text-gray-800 dark:text-slate-200"
                        }`}
                      >
                        {message.group.name}
                        {isUnread && (
                          <span className="ml-1.5 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            {t("new")}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                        {moment(message.createdAt).fromNow()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[60px]">
                        {isMe ? t("you") : senderInfo.full_name?.split(" ")[0]}:
                      </span>
                      <p className="text-gray-500 dark:text-slate-400 truncate flex-1">
                        {message.text ? message.text : `📷 ${t("image")}`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default RecentMessages;
