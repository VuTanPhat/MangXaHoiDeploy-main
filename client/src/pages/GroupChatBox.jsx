/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { ImageIcon, SendHorizonal, Video, Phone, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { addMessage, resetMessages } from "../features/messages/messagesSlice";
import toast from "react-hot-toast";
import moment from "moment";
import GroupVideoCall from "../components/GroupVideoCall";
import { useSocket } from "../context/SocketContext";

const GroupChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const currentUser = useSelector((state) => state.user.value);
  const { groupId } = useParams();
  const { getToken, userId: currentUserId } = useAuth();
  const dispatch = useDispatch();
  const { socket } = useSocket();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [group, setGroup] = useState(null);
  const [sending, setSending] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState("video");
  const [activeCall, setActiveCall] = useState(null); // { roomId, participants, callType }
  const [isJoiningExisting, setIsJoiningExisting] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch group info
  const fetchGroupInfo = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/group/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const g = data.groups.find((g) => g._id === groupId);
        setGroup(g);
      }
    } catch (error) {
      toast.error("Cannot load group info");
    }
  };

  // Check for active call in this group
  const checkActiveCall = useCallback(() => {
    if (socket && groupId) {
      socket.emit("group-call:check-active", { groupId }, (response) => {
        if (response.hasActiveCall) {
          setActiveCall({
            roomId: response.roomId,
            participants: response.participants,
            callType: response.callType,
          });
        } else {
          setActiveCall(null);
        }
      });
    }
  }, [socket, groupId]);

  // Check for active call periodically and on mount
  useEffect(() => {
    checkActiveCall();
    const interval = setInterval(checkActiveCall, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [checkActiveCall]);

  // Handle starting or joining a call
  const handleStartCall = (type) => {
    setCallType(type);
    if (activeCall) {
      // Join existing call
      setIsJoiningExisting(true);
    } else {
      // Start new call
      setIsJoiningExisting(false);
    }
    setShowVideoCall(true);
  };

  // Fetch group messages
  const fetchGroupMessages = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/group/messages",
        { group_id: groupId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) throw new Error(data.message);

      dispatch(resetMessages());
      data.messages.forEach((m) => dispatch(addMessage(m)));
    } catch (e) {
      toast.error("Cannot load messages");
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!text.trim() && !image) || sending) return;

    setSending(true);
    const messageText = text;
    const messageImage = image;

    // Reset input ngay lập tức
    setText("");
    setImage(null);

    try {
      const token = await getToken();
      const formData = new FormData();

      formData.append("group_id", groupId);
      formData.append("text", messageText);
      if (messageImage) formData.append("image", messageImage);

      const { data } = await api.post("/api/group/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) throw new Error(data.message);

      // Tạo message object với đầy đủ thông tin user để render đúng
      const newMessage = {
        ...data.message,
        from_user_id:
          typeof data.message.from_user_id === "string"
            ? {
                _id: currentUserId,
                full_name: currentUser?.full_name || "You",
                profile_picture: currentUser?.profile_picture || "",
              }
            : data.message.from_user_id,
      };

      dispatch(addMessage(newMessage));
    } catch (error) {
      toast.error(error.message);
      // Khôi phục input nếu lỗi
      setText(messageText);
      setImage(messageImage);
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm("Bạn có chắc muốn xoá tin nhắn này?")) return;
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/message/delete/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        dispatch({ type: "messages/deleteMessage", payload: messageId });
        toast.success("Đã xoá tin nhắn");
      }
    } catch (err) {
      toast.error("Không thể xoá tin nhắn");
    }
  };

  // Helper để lấy user id từ message
  const getSenderId = (msg) => {
    return typeof msg.from_user_id === "string"
      ? msg.from_user_id
      : msg.from_user_id?._id;
  };

  // Helper để lấy user info từ message
  const getSenderInfo = (msg) => {
    if (typeof msg.from_user_id === "object" && msg.from_user_id !== null) {
      return msg.from_user_id;
    }
    // Fallback nếu chỉ có ID
    return {
      _id: msg.from_user_id,
      full_name: "User",
      profile_picture: "https://via.placeholder.com/40",
    };
  };

  useEffect(() => {
    fetchGroupInfo();
    fetchGroupMessages();
    return () => dispatch(resetMessages());
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    group && (
      <div className="flex flex-col h-screen">
        {/* HEADER - giống ChatBox */}
        <div className="flex items-center justify-between p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-300 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <img
              src={
                group.avatar ||
                "https://cdn-icons-png.flaticon.com/512/711/711245.png"
              }
              alt=""
              className="size-8 rounded-full"
            />
            <div>
              <p className="font-medium dark:text-white">{group.name}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 -mt-1.5">
                {group.members.length} thành viên
              </p>
            </div>
          </div>

          {/* Video/Audio Call Buttons */}
          <div className="flex items-center gap-2">
            {/* Active call indicator */}
            {activeCall && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-400 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <Users size={14} />
                <span>{activeCall.participants.length} đang gọi</span>
              </div>
            )}
            <button
              onClick={() => handleStartCall("audio")}
              className={`p-2 rounded-full text-white transition-colors ${
                activeCall
                  ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-300"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              title={activeCall ? "Tham gia cuộc gọi" : "Gọi thoại nhóm"}
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleStartCall("video")}
              className={`p-2 rounded-full text-white transition-colors ${
                activeCall
                  ? "bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-300"
                  : "bg-indigo-500 hover:bg-indigo-600"
              }`}
              title={activeCall ? "Tham gia cuộc gọi" : "Gọi video nhóm"}
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES - giống ChatBox */}
        <div className="p-5 md:px-10 h-full overflow-y-scroll">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((msg, index) => {
                const senderId = getSenderId(msg);
                const senderInfo = getSenderInfo(msg);
                const isMe = senderId === currentUserId;
                const showSenderName =
                  !isMe &&
                  (index === 0 ||
                    getSenderId(
                      messages.toSorted(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                      )[index - 1]
                    ) !== senderId);

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Tên người gửi - chỉ hiện cho người khác */}
                    {showSenderName && (
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={senderInfo.profile_picture}
                          alt=""
                          className="size-5 rounded-full"
                        />
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {senderInfo.full_name}
                        </span>
                      </div>
                    )}

                    <div className="relative group">
                      <div
                        className={`p-2 text-sm max-w-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow dark:shadow-slate-900 ${
                          isMe ? "rounded-br-none" : "rounded-bl-none"
                        }`}
                      >
                        {msg.message_type === "image" && msg.media_url && (
                          <img
                            src={msg.media_url}
                            className="w-full max-w-sm rounded-lg mb-1"
                            alt=""
                          />
                        )}
                        <p>{msg.text}</p>
                      </div>

                      {/* Nút xoá - chỉ hiện cho tin nhắn mình gửi */}
                      {isMe && (
                        <button
                          onClick={() => deleteMessage(msg._id)}
                          className="absolute -right-7 top-2 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT BAR - giống ChatBox */}
        <div className="px-4">
          <div className="flex items-center gap-3 pl-5 p-1.5 bg-white dark:bg-slate-800 w-full max-w-xl mx-auto border border-gray-200 dark:border-slate-700 shadow dark:shadow-slate-900 rounded-full mb-5">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700 dark:text-slate-200 bg-transparent dark:placeholder-slate-400"
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
              disabled={sending}
            />
            <label htmlFor="group-image">
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
                id="group-image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
            <button
              onClick={sendMessage}
              disabled={sending || (!text.trim() && !image)}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>

        {/* Group Video Call Modal */}
        <GroupVideoCall
          isOpen={showVideoCall}
          onClose={() => {
            setShowVideoCall(false);
            setIsJoiningExisting(false);
            // Recheck active call after closing
            setTimeout(checkActiveCall, 1000);
          }}
          callType={callType}
          groupId={groupId}
          groupName={group?.name}
          groupMembers={group?.members || []}
          currentUserId={currentUserId}
          currentUserName={currentUser?.full_name}
          currentUserAvatar={currentUser?.profile_picture}
          isIncoming={isJoiningExisting}
          incomingRoomId={isJoiningExisting ? activeCall?.roomId : null}
        />
      </div>
    )
  );
};

export default GroupChatBox;
