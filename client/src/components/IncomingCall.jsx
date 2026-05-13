/* eslint-disable no-unused-vars */
import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

const IncomingCall = ({
  callerName,
  callerAvatar,
  callType,
  isGroupCall,
  groupName,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Caller Avatar */}
        <div className="relative mb-6">
          <img
            src={callerAvatar || "/default-avatar.png"}
            alt=""
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-indigo-500"
          />
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-indigo-500 animate-ping opacity-30"></div>
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-semibold text-white mb-1">
          {isGroupCall ? groupName : callerName}
        </h3>
        <p className="text-slate-400 mb-6">
          {callType === "video"
            ? "Cuộc gọi video đến..."
            : "Cuộc gọi thoại đến..."}
        </p>

        {/* Call Type Icon */}
        <div className="flex justify-center mb-8">
          {callType === "video" ? (
            <Video className="w-8 h-8 text-indigo-400 animate-pulse" />
          ) : (
            <Phone className="w-8 h-8 text-indigo-400 animate-pulse" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all group-hover:scale-110">
              <PhoneOff className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-slate-400">Từ chối</span>
          </button>

          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="p-4 rounded-full bg-green-500 hover:bg-green-600 transition-all group-hover:scale-110">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-slate-400">Chấp nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
