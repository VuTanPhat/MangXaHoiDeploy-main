/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { dummyMessagesData, dummyUserData } from "../assets/assets";
import {
  ImageIcon,
  SendHorizonal,
  Video,
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import {
  addMessage,
  fetchMessages,
  resetMessages,
} from "../features/messages/messagesSlice";
import toast from "react-hot-toast";
import { useLanguage } from "../context/languageUtils";
import VideoCall from "../components/VideoCall";

const ChatBox = () => {
  const { t } = useLanguage();
  const { messages } = useSelector((state) => state.messages);
  const { userId } = useParams();
  const { getToken, userId: currentUserId } = useAuth();
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState("video");
  const messagesEndRef = useRef(null);
  const currentUser = useSelector((state) => state.user.value);

  const connections = useSelector((state) => state.connections.connections);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;

      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      image && formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setText("");
        setImage(null);
        dispatch(addMessage(data.message));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchUserMessages();

    return () => {
      dispatch(resetMessages());
    };
  }, [userId]);

  useEffect(() => {
    if (connections.length > 0) {
      const user = connections.find((connection) => connection._id === userId);
      setUser(user);
    }
  }, [connections, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm(t("confirmDeleteMessage"))) return;

    try {
      const token = await getToken();

      const { data } = await api.delete(`/api/message/delete/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(t("messageDeleted"));

        // Cập nhật Redux: xoá tin nhắn khỏi state FE
        dispatch({
          type: "messages/deleteMessage",
          payload: messageId,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    user && (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-300 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <img
              src={user.profile_picture}
              alt=""
              className="size-8 rounded-full"
            />
            <div>
              <p className="font-medium dark:text-white">{user.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 -mt-1.5">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Video/Audio Call Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCallType("audio");
                setShowVideoCall(true);
              }}
              className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Gọi thoại"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setCallType("video");
                setShowVideoCall(true);
              }}
              className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              title="Gọi video"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-5 md:px-10 h-full overflow-y-scroll">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    message.to_user_id !== user._id
                      ? "items-start"
                      : "items-end"
                  }`}
                >
                  <div className="relative group">
                    {/* Call Message */}
                    {message.message_type === "call" ? (
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          message.call_status === "answered"
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : message.call_status === "rejected"
                            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                            : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-full ${
                            message.call_status === "answered"
                              ? "bg-green-100 dark:bg-green-800"
                              : message.call_status === "rejected"
                              ? "bg-red-100 dark:bg-red-800"
                              : "bg-orange-100 dark:bg-orange-800"
                          }`}
                        >
                          {message.call_status === "answered" ? (
                            <PhoneCall
                              className={`w-4 h-4 ${
                                message.call_type === "video" ? "hidden" : ""
                              } text-green-600 dark:text-green-400`}
                            />
                          ) : message.call_status === "rejected" ? (
                            <PhoneOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <PhoneMissed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          )}
                          {message.call_status === "answered" &&
                            message.call_type === "video" && (
                              <Video className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {message.text}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {message.call_type === "video"
                              ? "Video call"
                              : "Voice call"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Regular Message */
                      <div
                        className={`p-2 text-sm max-w-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow dark:shadow-slate-900 ${
                          message.to_user_id !== user._id
                            ? "rounded-bl-none"
                            : "rounded-br-none"
                        }`}
                      >
                        {message.message_type === "image" && (
                          <img
                            src={message.media_url}
                            className="w-full max-w-sm rounded-lg mb-1"
                            alt=""
                          />
                        )}
                        <p>{message.text}</p>
                      </div>
                    )}
                    {/* Nút xoá - chỉ hiện cho tin nhắn mình gửi */}
                    {message.from_user_id === currentUserId &&
                      message.message_type !== "call" && (
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="absolute -right-7 top-2 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="px-4">
          <div className="flex items-center gap-3 pl-5 p-1.5 bg-white dark:bg-slate-800 w-full max-w-xl mx-auto border border-gray-200 dark:border-slate-700 shadow dark:shadow-slate-900 rounded-full mb-5">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700 dark:text-slate-200 bg-transparent dark:placeholder-slate-400"
              placeholder={t("typeMessage")}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
            <label htmlFor="image">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt=""
                  className="h-8 rounded"
                />
              ) : (
                <ImageIcon className="size-7 text-gray-400 cursor-pointer" />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
            <button
              onClick={sendMessage}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>

        {/* Video Call Modal */}
        <VideoCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          callType={callType}
          isIncoming={false}
          remoteUserId={userId}
          remoteUserName={user?.full_name}
          remoteUserAvatar={user?.profile_picture}
          currentUserId={currentUserId}
          currentUserName={currentUser?.full_name}
          currentUserAvatar={currentUser?.profile_picture}
        />
      </div>
    )
  );
};

export default ChatBox;
