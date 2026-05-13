import { useEffect, useRef, useState, useCallback } from "react";
import {
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
  Users,
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

// ICE servers for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// Video Tile Component - handles individual video with click to expand
const VideoTile = ({
  stream,
  name,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isScreenShare = false,
  onClickExpand,
  initial,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative bg-slate-800 rounded-xl overflow-hidden min-h-[180px] cursor-pointer group transition-all hover:ring-2 hover:ring-indigo-500 ${
        isScreenShare ? "ring-2 ring-green-500" : ""
      }`}
      onClick={onClickExpand}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${
          isVideoOff && !isScreenShare ? "hidden" : ""
        }`}
      />

      {/* Avatar placeholder when video is off */}
      {isVideoOff && !isScreenShare && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{initial}</span>
          </div>
        </div>
      )}

      {/* Screen share indicator */}
      {isScreenShare && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 rounded text-white text-xs flex items-center gap-1">
          <Monitor size={12} />
          <span>Đang chia sẻ</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-sm flex items-center gap-1.5">
        <span>{isLocal ? "Bạn" : name}</span>
        {isMuted && <MicOff size={12} className="text-red-400" />}
      </div>

      {/* Expand hint on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-black/50 rounded-full p-2">
          <Maximize2 size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
};

// Fullscreen Video Modal
const FullscreenVideo = ({ stream, name, onClose, isScreenShare }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-full max-h-full object-contain"
      />
      <div className="absolute top-4 left-4 px-3 py-2 bg-black/60 rounded-lg text-white flex items-center gap-2">
        {isScreenShare && <Monitor size={16} className="text-green-400" />}
        <span className="font-medium">{name}</span>
      </div>
      <button
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        onClick={onClose}
      >
        <X size={24} className="text-white" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-lg text-white text-sm">
        Nhấn bất kỳ đâu để đóng
      </div>
    </div>
  );
};

const GroupVideoCall = ({
  isOpen,
  onClose,
  callType = "video",
  groupId,
  groupName,
  groupMembers = [],
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isIncoming = false,
  incomingRoomId,
  // incomingCallerId - reserved for future use
}) => {
  const { socket } = useSocket();

  // State
  const [callStatus, setCallStatus] = useState("initializing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [expandedVideo, setExpandedVideo] = useState(null); // { peerId, stream, name, isScreenShare }
  const [screenSharers, setScreenSharers] = useState(new Set()); // Track who is sharing screen

  // Refs
  const localVideoRef = useRef(null);
  const containerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const callTimerRef = useRef(null);
  const roomIdRef = useRef(incomingRoomId || "");
  const isInitializedRef = useRef(false);

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // ICE candidate queue for each peer
  const iceCandidateQueues = useRef(new Map());

  // Create peer connection for a specific user
  const createPeerConnection = useCallback(
    (peerId, peerName) => {
      console.log("[GroupCall] Creating peer connection for:", peerId);

      // Close existing connection if any
      if (peerConnectionsRef.current.has(peerId)) {
        const existingPc = peerConnectionsRef.current.get(peerId);
        existingPc.close();
        peerConnectionsRef.current.delete(peerId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Initialize ICE candidate queue
      iceCandidateQueues.current.set(peerId, []);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log(
            "[GroupCall] Adding local track to peer:",
            peerId,
            track.kind
          );
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote tracks - this is crucial for receiving video
      pc.ontrack = (event) => {
        console.log(
          "[GroupCall] *** Received remote track from:",
          peerId,
          event.track.kind
        );
        console.log("[GroupCall] Stream:", event.streams[0]);

        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];

          // Update remote streams state
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.set(peerId, { stream: remoteStream, name: peerName });
            console.log(
              "[GroupCall] Updated remoteStreams, count:",
              newMap.size
            );
            return newMap;
          });
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log("[GroupCall] Sending ICE candidate to:", peerId);
          socket.emit("group-call:ice-candidate", {
            roomId: roomIdRef.current,
            candidate: event.candidate,
            targetUserId: peerId,
          });
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log(
          "[GroupCall] ICE state with",
          peerId,
          ":",
          pc.iceConnectionState
        );
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log(
          "[GroupCall] Connection state with",
          peerId,
          ":",
          pc.connectionState
        );

        if (pc.connectionState === "connected") {
          setCallStatus("connected");
          if (!callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          }
        } else if (pc.connectionState === "failed") {
          console.log("[GroupCall] Connection failed with:", peerId);
          // Try to restart ICE
          pc.restartIce();
        } else if (pc.connectionState === "disconnected") {
          console.log("[GroupCall] Disconnected from:", peerId);
        }
      };

      // Handle negotiation needed (for renegotiation like screen sharing)
      pc.onnegotiationneeded = async () => {
        console.log("[GroupCall] Negotiation needed with:", peerId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket?.emit("group-call:offer", {
            roomId: roomIdRef.current,
            offer: pc.localDescription,
            targetUserId: peerId,
            senderName: currentUserName,
          });
        } catch (err) {
          console.error("[GroupCall] Negotiation error:", err);
        }
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [socket, currentUserName]
  );

  // Process queued ICE candidates
  const processIceCandidateQueue = useCallback(async (peerId) => {
    const queue = iceCandidateQueues.current.get(peerId) || [];
    const pc = peerConnectionsRef.current.get(peerId);

    if (pc && pc.remoteDescription) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[GroupCall] Added queued ICE candidate for:", peerId);
        } catch (err) {
          console.error("[GroupCall] Error adding queued ICE candidate:", err);
        }
      }
      iceCandidateQueues.current.set(peerId, []);
    }
  }, []);

  // Cleanup function - no dependencies to avoid re-creation
  const cleanupRef = useRef(null);
  cleanupRef.current = () => {
    console.log("[GroupCall] Cleaning up...");

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

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    iceCandidateQueues.current.clear();

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Reset all state
    setRemoteStreams(new Map());
    setParticipants([]);
    setCallStatus("initializing");
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(callType === "audio");
    setIsScreenSharing(false);
    setExpandedVideo(null);
    setScreenSharers(new Set());

    // Reset refs
    roomIdRef.current = "";
    isInitializedRef.current = false;
  };

  // Store props in refs to avoid dependency issues
  const propsRef = useRef({
    currentUserId,
    currentUserName,
    currentUserAvatar,
    groupId,
    groupName,
    groupMembers,
    callType,
    isIncoming,
    incomingRoomId,
    onClose,
  });
  propsRef.current = {
    currentUserId,
    currentUserName,
    currentUserAvatar,
    groupId,
    groupName,
    groupMembers,
    callType,
    isIncoming,
    incomingRoomId,
    onClose,
  };

  // Initialize call - only run once when isOpen becomes true
  useEffect(() => {
    if (!isOpen || !socket) return;
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const props = propsRef.current;

    const initializeCall = async () => {
      try {
        // Get media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: props.callType === "video",
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setCallStatus("connecting");

        if (props.isIncoming) {
          // Join existing call
          roomIdRef.current = props.incomingRoomId;
          socket.emit("group-call:join", {
            roomId: props.incomingRoomId,
            userId: props.currentUserId,
            userName: props.currentUserName,
            userAvatar: props.currentUserAvatar,
          });
        } else {
          // Initiate new call
          const memberIds = props.groupMembers
            .map((m) => m._id || m.user_id || m)
            .filter((id) => id !== props.currentUserId);

          socket.emit("group-call:initiate", {
            callerId: props.currentUserId,
            callerName: props.currentUserName,
            callerAvatar: props.currentUserAvatar,
            groupId: props.groupId,
            groupName: props.groupName,
            memberIds,
            callType: props.callType,
          });
        }
      } catch (error) {
        console.error("[GroupCall] Init error:", error);
        toast.error("Không thể truy cập camera/microphone");
        props.onClose();
      }
    };

    initializeCall();

    return () => {
      cleanupRef.current?.();
    };
  }, [isOpen, socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Room created (initiator receives this)
    const handleRoomCreated = ({ roomId }) => {
      console.log("[GroupCall] Room created:", roomId);
      roomIdRef.current = roomId;
    };

    // New user joined the call
    const handleUserJoined = async ({ userId, userName, userAvatar }) => {
      console.log("[GroupCall] User joined:", userId, userName);

      setParticipants((prev) => {
        if (prev.find((p) => p.id === userId)) return prev;
        return [...prev, { id: userId, name: userName, avatar: userAvatar }];
      });

      // Create offer for new user (if we're already in the call)
      try {
        const pc = createPeerConnection(userId, userName);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("group-call:offer", {
          roomId: roomIdRef.current,
          offer,
          targetUserId: userId,
          senderName: currentUserName,
        });
      } catch (error) {
        console.error("[GroupCall] Error creating offer:", error);
      }
    };

    // Receive offer from another participant
    const handleOffer = async ({ offer, fromUserId, senderName }) => {
      console.log("[GroupCall] Received offer from:", fromUserId);

      try {
        const pc = createPeerConnection(fromUserId, senderName);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Process any queued ICE candidates
        await processIceCandidateQueue(fromUserId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("group-call:answer", {
          roomId: roomIdRef.current,
          answer,
          targetUserId: fromUserId,
        });
      } catch (error) {
        console.error("[GroupCall] Error handling offer:", error);
      }
    };

    // Receive answer
    const handleAnswer = async ({ answer, fromUserId }) => {
      console.log("[GroupCall] Received answer from:", fromUserId);
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Process any queued ICE candidates
          await processIceCandidateQueue(fromUserId);
        } catch (error) {
          console.error("[GroupCall] Error setting answer:", error);
        }
      }
    };

    // Receive ICE candidate
    const handleIceCandidate = async ({ candidate, fromUserId }) => {
      if (!candidate) return;

      const pc = peerConnectionsRef.current.get(fromUserId);

      if (pc && pc.remoteDescription) {
        // PC is ready, add candidate directly
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[GroupCall] Added ICE candidate from:", fromUserId);
        } catch (error) {
          console.error("[GroupCall] Error adding ICE candidate:", error);
        }
      } else {
        // Queue the candidate for later
        console.log("[GroupCall] Queuing ICE candidate from:", fromUserId);
        const queue = iceCandidateQueues.current.get(fromUserId) || [];
        queue.push(candidate);
        iceCandidateQueues.current.set(fromUserId, queue);
      }
    };

    // User left the call
    const handleUserLeft = ({ userId }) => {
      console.log("[GroupCall] User left:", userId);

      const pc = peerConnectionsRef.current.get(userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }

      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });

      setParticipants((prev) => prev.filter((p) => p.id !== userId));
    };

    // Existing participants when joining
    const handleExistingParticipants = async ({
      participants: existingParticipants,
    }) => {
      console.log("[GroupCall] Existing participants:", existingParticipants);

      for (const participant of existingParticipants) {
        if (participant.userId !== currentUserId) {
          setParticipants((prev) => {
            if (prev.find((p) => p.id === participant.userId)) return prev;
            return [
              ...prev,
              {
                id: participant.userId,
                name: participant.userName,
                avatar: participant.userAvatar,
              },
            ];
          });
        }
      }
    };

    // Screen share started by another user
    const handleScreenShareStarted = ({ userId, userName }) => {
      setScreenSharers((prev) => new Set([...prev, userId]));
      toast(`${userName} đang chia sẻ màn hình`, { icon: "🖥️" });
    };

    // Screen share stopped
    const handleScreenShareStopped = ({ userId }) => {
      setScreenSharers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast("Đã dừng chia sẻ màn hình", { icon: "🖥️" });
    };

    socket.on("call:room-created", handleRoomCreated);
    socket.on("group-call:user-joined", handleUserJoined);
    socket.on("group-call:offer", handleOffer);
    socket.on("group-call:answer", handleAnswer);
    socket.on("group-call:ice-candidate", handleIceCandidate);
    socket.on("group-call:user-left", handleUserLeft);
    socket.on("group-call:existing-participants", handleExistingParticipants);
    socket.on("group-call:screen-share-started", handleScreenShareStarted);
    socket.on("group-call:screen-share-stopped", handleScreenShareStopped);

    return () => {
      socket.off("call:room-created", handleRoomCreated);
      socket.off("group-call:user-joined", handleUserJoined);
      socket.off("group-call:offer", handleOffer);
      socket.off("group-call:answer", handleAnswer);
      socket.off("group-call:ice-candidate", handleIceCandidate);
      socket.off("group-call:user-left", handleUserLeft);
      socket.off(
        "group-call:existing-participants",
        handleExistingParticipants
      );
      socket.off("group-call:screen-share-started", handleScreenShareStarted);
      socket.off("group-call:screen-share-stopped", handleScreenShareStopped);
    };
  }, [
    socket,
    isOpen,
    currentUserId,
    currentUserName,
    createPeerConnection,
    processIceCandidateQueue,
  ]);

  // Handle end call
  const handleEndCall = () => {
    if (socket && roomIdRef.current) {
      socket.emit("group-call:leave", {
        roomId: roomIdRef.current,
        userId: currentUserId,
      });
    }

    if (callDuration > 0) {
      const mins = Math.floor(callDuration / 60);
      const secs = callDuration % 60;
      const durationText =
        mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`;
      toast.success(`Cuộc gọi kết thúc - ${durationText}`, { icon: "📞" });
    }

    cleanupRef.current?.();
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

      // Replace screen track with camera track in all peer connections
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }

      setIsScreenSharing(false);
      socket?.emit("group-call:screen-share-stopped", {
        roomId: roomIdRef.current,
        userId: currentUserId,
      });
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace camera track with screen track in all peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        socket?.emit("group-call:screen-share-started", {
          roomId: roomIdRef.current,
          userId: currentUserId,
          userName: currentUserName,
        });

        toast.success("Đang chia sẻ màn hình", { icon: "🖥️" });
      } catch (error) {
        console.error("[GroupCall] Screen share error:", error);
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

  const remoteStreamArray = Array.from(remoteStreams.entries());
  const participantCount = remoteStreamArray.length + 1;

  // Calculate grid layout
  const getGridClass = () => {
    if (participantCount <= 1) return "grid-cols-1";
    if (participantCount === 2) return "grid-cols-2";
    if (participantCount <= 4) return "grid-cols-2";
    if (participantCount <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-full h-full bg-slate-900 flex flex-col"
      >
        {/* Top Bar */}
        <div className="flex-shrink-0 p-4 bg-gradient-to-b from-black/70 to-transparent absolute top-0 left-0 right-0 z-10">
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
                  : "Đang kết nối..."}
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-sm">
                <Users size={14} />
                <span>{participantCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{groupName}</span>
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
        </div>

        {/* Video Grid */}
        <div
          className={`flex-1 p-4 pt-16 pb-24 grid ${getGridClass()} gap-3 auto-rows-fr overflow-y-auto`}
        >
          {/* Local Video */}
          <VideoTile
            stream={localStreamRef.current}
            name={currentUserName}
            isLocal={true}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenShare={isScreenSharing}
            initial={currentUserName?.charAt(0)?.toUpperCase()}
            onClickExpand={() =>
              setExpandedVideo({
                stream: localStreamRef.current,
                name: "Bạn",
                isScreenShare: isScreenSharing,
              })
            }
          />

          {/* Remote Videos */}
          {remoteStreamArray.map(([peerId, { stream, name }]) => (
            <VideoTile
              key={peerId}
              stream={stream}
              name={name}
              isScreenShare={screenSharers.has(peerId)}
              initial={name?.charAt(0)?.toUpperCase()}
              onClickExpand={() =>
                setExpandedVideo({
                  peerId,
                  stream,
                  name,
                  isScreenShare: screenSharers.has(peerId),
                })
              }
            />
          ))}

          {/* Waiting for others */}
          {remoteStreamArray.length === 0 && (
            <div className="relative bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center min-h-[180px]">
              <div className="text-center text-slate-400">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>Đang chờ người khác tham gia...</p>
                <p className="text-xs mt-1 text-slate-500">
                  {participants.length > 0
                    ? `${participants.length} người đang kết nối...`
                    : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Video Modal */}
        {expandedVideo && (
          <FullscreenVideo
            stream={expandedVideo.stream}
            name={expandedVideo.name}
            isScreenShare={expandedVideo.isScreenShare}
            onClose={() => setExpandedVideo(null)}
          />
        )}

        {/* Control Bar */}
        <div className="flex-shrink-0 p-6 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
              title={isMuted ? "Bật mic" : "Tắt mic"}
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
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default GroupVideoCall;
