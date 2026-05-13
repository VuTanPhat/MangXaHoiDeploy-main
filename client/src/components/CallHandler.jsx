/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import IncomingCall from "./IncomingCall";
import VideoCall from "./VideoCall";
import GroupVideoCall from "./GroupVideoCall";

const CallHandler = () => {
  const { socket } = useSocket();
  const { userId: currentUserId } = useAuth();
  const currentUser = useSelector((state) => state.user.value);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Handle incoming private call
    socket.on("call:incoming", (data) => {
      setIncomingCall({
        ...data,
        isGroupCall: false,
      });
    });

    // Handle incoming group call
    socket.on("group-call:incoming", (data) => {
      setIncomingCall({
        ...data,
        isGroupCall: true,
      });
    });

    return () => {
      socket.off("call:incoming");
      socket.off("group-call:incoming");
    };
  }, [socket]);

  const handleAcceptCall = () => {
    if (incomingCall) {
      setActiveCall({
        ...incomingCall,
        isIncoming: true,
      });
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall && socket) {
      if (incomingCall.isGroupCall) {
        // Just close for group calls
      } else {
        socket.emit("call:reject", {
          roomId: incomingCall.roomId,
          rejecterId: currentUserId,
        });
      }
      setIncomingCall(null);
    }
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  return (
    <>
      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCall
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          callType={incomingCall.callType}
          isGroupCall={incomingCall.isGroupCall}
          groupName={incomingCall.groupName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active Call - Private */}
      {activeCall && !activeCall.isGroupCall && (
        <VideoCall
          isOpen={true}
          onClose={handleEndCall}
          callType={activeCall.callType}
          isIncoming={true}
          roomId={activeCall.roomId}
          remoteUserId={activeCall.callerId}
          remoteUserName={activeCall.callerName}
          remoteUserAvatar={activeCall.callerAvatar}
          currentUserId={currentUserId}
          currentUserName={currentUser?.full_name}
          currentUserAvatar={currentUser?.profile_picture}
        />
      )}

      {/* Active Call - Group */}
      {activeCall && activeCall.isGroupCall && (
        <GroupVideoCall
          isOpen={true}
          onClose={handleEndCall}
          callType={activeCall.callType}
          isIncoming={true}
          incomingRoomId={activeCall.roomId}
          incomingCallerId={activeCall.callerId}
          groupId={activeCall.groupId}
          groupName={activeCall.groupName}
          currentUserId={currentUserId}
          currentUserName={currentUser?.full_name}
          currentUserAvatar={currentUser?.profile_picture}
        />
      )}
    </>
  );
};

export default CallHandler;
