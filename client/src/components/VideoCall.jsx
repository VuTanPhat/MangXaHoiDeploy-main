import { useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Maximize2,
  Minimize2,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

// ICE servers for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoCall = ({
  isOpen,
  onClose,
  callType = "video",
  isIncoming = false,
  roomId: initialRoomId,
  remoteUserId: initialRemoteUserId,
  remoteUserName,
  remoteUserAvatar,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isGroupCall = false,
  groupId,
  groupName,
  groupMembers = [],
}) => {
  const { socket } = useSocket();

  // State
  const [callStatus, setCallStatus] = useState(
    isIncoming ? "connecting" : "calling"
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const containerRef = useRef(null);
  const callTimerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isInitializedRef = useRef(false);
  const currentRoomIdRef = useRef(initialRoomId || "");
  const remoteUserIdRef = useRef(initialRemoteUserId || "");

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Cleanup function
  const cleanup = () => {
    console.log("[VideoCall] Cleaning up...");

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    pendingCandidatesRef.current = [];
    isInitializedRef.current = false;
  };

  // Get user media
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log("[VideoCall] Got local media stream");
      return stream;
    } catch (error) {
      console.error("[VideoCall] Error getting user media:", error);
      toast.error("Không thể truy cập camera/microphone");
      throw error;
    }
  };

  // Create peer connection
  const createPeerConnection = () => {
    console.log("[VideoCall] Creating peer connection...");

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("[VideoCall] Adding local track:", track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("[VideoCall] Received remote track:", event.track.kind);
      if (event.streams[0] && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log("[VideoCall] Set remote video stream");
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log("[VideoCall] Sending ICE candidate");
        socket.emit("webrtc:ice-candidate", {
          roomId: currentRoomIdRef.current,
          candidate: event.candidate,
          targetUserId: remoteUserIdRef.current,
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log("[VideoCall] Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        // Start timer
        if (!callTimerRef.current) {
          callTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      } else if (pc.connectionState === "failed") {
        toast.error("Kết nối thất bại");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[VideoCall] ICE state:", pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Initialize call (main effect)
  useEffect(() => {
    if (!isOpen || !socket) return;
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log("[VideoCall] Initializing...", {
      isIncoming,
      initialRoomId,
      initialRemoteUserId,
    });

    const initializeCall = async () => {
      try {
        // Get local media first
        await getUserMedia();

        if (isIncoming) {
          // RECEIVER: Accept the call
          console.log("[VideoCall] Accepting incoming call...");
          currentRoomIdRef.current = initialRoomId;
          remoteUserIdRef.current = initialRemoteUserId;

          socket.emit("call:accept", {
            roomId: initialRoomId,
            accepterId: currentUserId,
          });
        } else {
          // CALLER: Initiate the call
          console.log("[VideoCall] Initiating call to:", initialRemoteUserId);
          remoteUserIdRef.current = initialRemoteUserId;

          if (!isGroupCall) {
            socket.emit("call:initiate", {
              callerId: currentUserId,
              callerName: currentUserName,
              callerAvatar: currentUserAvatar,
              receiverId: initialRemoteUserId,
              callType,
            });
          } else {
            const memberIds = groupMembers.map((m) => m._id || m.user_id || m);
            socket.emit("group-call:initiate", {
              callerId: currentUserId,
              callerName: currentUserName,
              callerAvatar: currentUserAvatar,
              groupId,
              groupName,
              memberIds,
              callType,
            });
          }
        }
      } catch (error) {
        console.error("[VideoCall] Init error:", error);
        onClose();
      }
    };

    initializeCall();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Room created (caller receives this)
    const handleRoomCreated = ({ roomId }) => {
      console.log("[VideoCall] Room created:", roomId);
      currentRoomIdRef.current = roomId;
    };

    // Call accepted (caller receives this) - CREATE OFFER
    const handleCallAccepted = async ({ roomId, accepterId }) => {
      console.log("[VideoCall] Call accepted by:", accepterId);
      remoteUserIdRef.current = accepterId;
      currentRoomIdRef.current = roomId;
      setCallStatus("connecting");

      try {
        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("[VideoCall] Sending offer to:", accepterId);
        socket.emit("webrtc:offer", {
          roomId,
          offer,
          targetUserId: accepterId,
        });
      } catch (error) {
        console.error("[VideoCall] Error creating offer:", error);
      }
    };

    // Receive offer (receiver gets this) - CREATE ANSWER
    const handleOffer = async ({ roomId, offer, fromUserId }) => {
      console.log("[VideoCall] Received offer from:", fromUserId);
      remoteUserIdRef.current = fromUserId;
      currentRoomIdRef.current = roomId;

      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Process pending candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("[VideoCall] Sending answer to:", fromUserId);
        socket.emit("webrtc:answer", {
          roomId,
          answer,
          targetUserId: fromUserId,
        });
      } catch (error) {
        console.error("[VideoCall] Error handling offer:", error);
      }
    };

    // Receive answer (caller gets this)
    const handleAnswer = async ({ answer, fromUserId }) => {
      console.log("[VideoCall] Received answer from:", fromUserId);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          // Process pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          pendingCandidatesRef.current = [];
        }
      } catch (error) {
        console.error("[VideoCall] Error handling answer:", error);
      }
    };

    // Receive ICE candidate
    const handleIceCandidate = async ({ candidate, fromUserId }) => {
      console.log("[VideoCall] Received ICE candidate from:", fromUserId);
      if (!candidate) return;

      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("[VideoCall] Error adding ICE candidate:", error);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    // Call rejected
    const handleCallRejected = ({ rejecterId }) => {
      console.log("[VideoCall] Call rejected by:", rejecterId);
      toast.error("Cuộc gọi bị từ chối");
      cleanup();
      onClose();
    };

    // Call ended
    const handleCallEnded = ({ endedBy }) => {
      console.log("[VideoCall] Call ended by:", endedBy);
      toast("Cuộc gọi đã kết thúc", { icon: "📞" });
      cleanup();
      onClose();
    };

    // User offline
    const handleUserOffline = () => {
      console.log("[VideoCall] User offline");
      toast.error("Người dùng không online");
      cleanup();
      onClose();
    };

    // Register listeners
    socket.on("call:room-created", handleRoomCreated);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:user-offline", handleUserOffline);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);

    return () => {
      socket.off("call:room-created", handleRoomCreated);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:user-offline", handleUserOffline);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isOpen]);

  // Handle end call
  const handleEndCall = () => {
    if (socket && currentRoomIdRef.current) {
      socket.emit("call:end", {
        roomId: currentRoomIdRef.current,
        userId: currentUserId,
        duration: callDuration,
      });
    }

    if (callDuration > 0) {
      const mins = Math.floor(callDuration / 60);
      const secs = callDuration % 60;
      const durationText =
        mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`;
      toast.success(`Cuộc gọi kết thúc - ${durationText}`, { icon: "📞" });
    }

    cleanup();
    onClose();
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Replace screen track with camera track
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      setIsScreenSharing(false);
      toast("Đã dừng chia sẻ màn hình", { icon: "🖥️" });
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace camera track with screen track
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        // Update local video to show screen
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        toast.success("Đang chia sẻ màn hình", { icon: "🖥️" });
      } catch (error) {
        console.error("[VideoCall] Screen share error:", error);
        if (error.name !== "NotAllowedError") {
          toast.error("Không thể chia sẻ màn hình");
        }
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-6xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden"
      >
        {/* Remote Video */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${
              callStatus !== "connected" ? "opacity-0 absolute" : ""
            }`}
          />

          {/* Placeholder when not connected */}
          {callStatus !== "connected" && (
            <div className="text-center absolute">
              <img
                src={remoteUserAvatar || "/default-avatar.png"}
                alt=""
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white/20"
              />
              <h3 className="text-2xl font-semibold text-white mb-2">
                {isGroupCall ? groupName : remoteUserName}
              </h3>
              <p className="text-slate-400">
                {callStatus === "calling" && "Đang gọi..."}
                {callStatus === "connecting" && "Đang kết nối..."}
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video */}
        {callType === "video" && (
          <div className="absolute bottom-24 right-4 w-48 h-36 bg-slate-700 rounded-lg overflow-hidden shadow-lg border-2 border-slate-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isVideoOff ? "hidden" : ""
              }`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-slate-400" />
              </div>
            )}
          </div>
        )}

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  callStatus === "connected" ? "bg-green-500" : "bg-yellow-500"
                } animate-pulse`}
              ></div>
              <span className="text-white font-medium">
                {callStatus === "connected"
                  ? formatDuration(callDuration)
                  : callStatus === "calling"
                  ? "Đang gọi..."
                  : "Đang kết nối..."}
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-white/20 hover:bg-white/30"
                }`}
                title={isVideoOff ? "Bật camera" : "Tắt camera"}
              >
                {isVideoOff ? (
                  <VideoOff className="w-6 h-6 text-white" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            {/* Screen Share Button */}
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-colors ${
                isScreenSharing
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
              title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-6 h-6 text-white" />
              ) : (
                <Monitor className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
