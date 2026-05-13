/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  SendHorizonal,
  Trash2,
  Sparkles,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import moment from "moment";
import { useLanguage } from "../context/languageUtils";

const AIChatBox = () => {
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/ai/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Load a conversation
  const loadConversation = async (conversationId) => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/ai/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setCurrentConversationId(conversationId);
        setMessages(data.conversation.messages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Create new conversation
  const createNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!text.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = text;
    setText("");
    setLoading(true);

    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/ai/chat",
        { message: messageText, conversationId: currentConversationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const aiMessage = {
          role: "assistant",
          content: data.message,
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Update conversation ID if new
        if (!currentConversationId && data.conversationId) {
          setCurrentConversationId(data.conversationId);
          fetchConversations();
        }
      } else {
        toast.error(data.message || "Failed to get AI response");
      }
    } catch (error) {
      toast.error("Failed to connect to AI");
      console.error(error);
    }
    setLoading(false);
  };

  // Delete conversation
  const deleteConversation = async (conversationId) => {
    if (!window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;

    try {
      const token = await getToken();
      const { data } = await api.delete(
        `/api/ai/conversation/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationId)
        );
        if (currentConversationId === conversationId) {
          createNewConversation();
        }
        toast.success("Đã xóa cuộc trò chuyện");
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
    setMenuOpenId(null);
  };

  // Rename conversation
  const renameConversation = async (conversationId) => {
    if (!editTitle.trim()) return;

    try {
      const token = await getToken();
      const { data } = await api.put(
        `/api/ai/conversation/${conversationId}`,
        { title: editTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversationId ? { ...c, title: editTitle } : c
          )
        );
        toast.success("Đã đổi tên");
      }
    } catch (error) {
      toast.error("Failed to rename");
    }
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Conversations List */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition"
          >
            <Plus className="w-5 h-5" />
            {t("newConversation")}
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-4">
              {t("noConversations")}
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer mb-1 ${
                  currentConversationId === conv._id
                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => loadConversation(conv._id)}
              >
                <MessageSquare className="w-4 h-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />

                {editingId === conv._id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded outline-none"
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameConversation(conv._id);
                      }}
                      className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {moment(conv.updatedAt).fromNow()}
                      </p>
                    </div>

                    {/* Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === conv._id ? null : conv._id
                          );
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenId === conv._id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(conv._id);
                              setEditTitle(conv.title);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg"
                          >
                            <Pencil className="w-4 h-4" />
                            {t("rename")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv._id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-300 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold dark:text-white">
                  {t("aiAssistant")}
                </p>
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 -mt-0.5">
                {currentConversationId ? t("chatting") : t("newConversation")}
              </p>
            </div>
          </div>
          <button
            onClick={createNewConversation}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition"
            title={t("newConversation")}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-5 md:px-10 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold dark:text-white mb-2">
                  {t("aiWelcome")}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  {t("aiDescription")}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {[
                    "Giúp tôi viết một bài đăng",
                    "Giải thích về AI",
                    "Cho tôi ý tưởng sáng tạo",
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setText(suggestion)}
                      className="px-4 py-2 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-full border border-gray-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  {message.role === "user" ? (
                    <img
                      src={currentUser?.profile_picture}
                      alt=""
                      className="w-8 h-8 rounded-full shadow flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`p-3 rounded-2xl shadow ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-sm shadow">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 pl-5 p-1.5 bg-gray-50 dark:bg-slate-800 w-full max-w-xl mx-auto border border-gray-200 dark:border-slate-700 shadow-sm rounded-full">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700 dark:text-slate-200 bg-transparent dark:placeholder-slate-400"
              placeholder={t("typeMessage")}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              onChange={(e) => setText(e.target.value)}
              value={text}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !text.trim()}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer text-white p-2 rounded-full transition"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">
            {t("aiDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox;
