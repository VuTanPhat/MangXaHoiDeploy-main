// Video Call Socket.IO Handler for WebRTC Signaling
import Message from "../models/Message.js";

// Store online users and their socket IDs
const onlineUsers = new Map(); // userId -> socketId
const activeRooms = new Map(); // roomId -> { participants: [], type: 'private' | 'group', callerId, receiverId, callType, startTime }

// Store io instance for external use
let ioInstance = null;

// Export function to get online users and io
export const getOnlineUsers = () => onlineUsers;
export const getIO = () => ioInstance;

export const setupSocketIO = (io) => {
  ioInstance = io;
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins with their userId
    socket.on("user:join", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} is online with socket ${socket.id}`);

      // Notify others that user is online
      socket.broadcast.emit("user:online", userId);
    });

    // Check if user is online
    socket.on("user:check-online", (userId, callback) => {
      const isOnline = onlineUsers.has(userId);
      callback(isOnline);
    });

    // ==================== PRIVATE CALL (1-1) ====================

    // Initiate a private call
    socket.on(
      "call:initiate",
      ({ callerId, callerName, callerAvatar, receiverId, callType }) => {
        console.log(`Call initiated: ${callerId} -> ${receiverId}`);
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          // Create a room for this call
          const roomId = `private_${callerId}_${receiverId}_${Date.now()}`;
          activeRooms.set(roomId, {
            participants: [callerId],
            type: "private",
            callType, // 'video' or 'audio'
            callerId,
            receiverId,
            startTime: null, // Will be set when call is accepted
          });

          console.log(`Room created: ${roomId}`);

          // Caller joins the room
          socket.join(roomId);

          // Notify receiver about incoming call
          io.to(receiverSocketId).emit("call:incoming", {
            roomId,
            callerId,
            callerName,
            callerAvatar,
            callType,
          });

          // Send room info back to caller
          socket.emit("call:room-created", { roomId });
        } else {
          console.log(`Receiver ${receiverId} is offline`);
          // Receiver is offline
          socket.emit("call:user-offline", { receiverId });
        }
      }
    );

    // Accept incoming call
    socket.on("call:accept", ({ roomId, accepterId }) => {
      console.log(`Call accepted: ${accepterId} accepted room ${roomId}`);
      const room = activeRooms.get(roomId);
      if (room) {
        room.participants.push(accepterId);
        room.startTime = Date.now(); // Record start time
        socket.join(roomId);

        // Notify caller that call was accepted
        const callerId = room.participants[0];
        const callerSocketId = onlineUsers.get(callerId);
        console.log(`Notifying caller ${callerId} at socket ${callerSocketId}`);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:accepted", { roomId, accepterId });
        }
      } else {
        console.log(`Room ${roomId} not found`);
      }
    });

    // Reject incoming call
    socket.on("call:reject", async ({ roomId, rejecterId }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        const callerId = room.participants[0];
        const callerSocketId = onlineUsers.get(callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:rejected", { roomId, rejecterId });
        }

        // Save rejected call to message history
        try {
          await Message.create({
            from_user_id: room.callerId,
            to_user_id: room.receiverId,
            message_type: "call",
            call_type: room.callType,
            call_duration: 0,
            call_status: "rejected",
            text: `Cuộc gọi ${
              room.callType === "video" ? "video" : "thoại"
            } bị từ chối`,
          });
        } catch (error) {
          console.error("Error saving rejected call:", error);
        }

        activeRooms.delete(roomId);
      }
    });

    // End call
    socket.on("call:end", async ({ roomId, userId, duration }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        // Notify all participants
        room.participants.forEach((participantId) => {
          if (participantId !== userId) {
            const participantSocketId = onlineUsers.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit("call:ended", {
                roomId,
                endedBy: userId,
                duration: duration || 0,
              });
            }
          }
        });

        // Save call to message history (only for private calls)
        if (room.type === "private" && room.callerId && room.receiverId) {
          try {
            const callDuration = duration || 0;
            const mins = Math.floor(callDuration / 60);
            const secs = callDuration % 60;
            let durationText = "";
            if (mins > 0) {
              durationText = `${mins} phút ${secs} giây`;
            } else {
              durationText = `${secs} giây`;
            }

            await Message.create({
              from_user_id: room.callerId,
              to_user_id: room.receiverId,
              message_type: "call",
              call_type: room.callType,
              call_duration: callDuration,
              call_status: callDuration > 0 ? "answered" : "missed",
              text:
                callDuration > 0
                  ? `Cuộc gọi ${
                      room.callType === "video" ? "video" : "thoại"
                    } - ${durationText}`
                  : `Cuộc gọi ${
                      room.callType === "video" ? "video" : "thoại"
                    } nhỡ`,
            });
          } catch (error) {
            console.error("Error saving call history:", error);
          }
        }

        activeRooms.delete(roomId);
      }
    });

    // ==================== GROUP CALL ====================

    // Check if there's an active call for a group
    socket.on("group-call:check-active", ({ groupId }, callback) => {
      // Find active room for this group
      let activeRoom = null;
      let activeRoomId = null;

      activeRooms.forEach((room, roomId) => {
        if (
          room.type === "group" &&
          room.groupId === groupId &&
          room.participants.length > 0
        ) {
          activeRoom = room;
          activeRoomId = roomId;
        }
      });

      if (activeRoom && activeRoomId) {
        callback({
          hasActiveCall: true,
          roomId: activeRoomId,
          participants: activeRoom.participants.map((pId) => ({
            userId: pId,
            userName: activeRoom.participantNames?.[pId] || "User",
          })),
          callType: activeRoom.callType,
        });
      } else {
        callback({ hasActiveCall: false });
      }
    });

    // Initiate a group call
    socket.on(
      "group-call:initiate",
      ({
        callerId,
        callerName,
        callerAvatar,
        groupId,
        groupName,
        memberIds,
        callType,
      }) => {
        const roomId = `group_${groupId}_${Date.now()}`;

        // Store initiator info
        const participantNames = {};
        const participantAvatars = {};
        participantNames[callerId] = callerName;
        participantAvatars[callerId] = callerAvatar;

        activeRooms.set(roomId, {
          participants: [callerId],
          type: "group",
          groupId,
          callType,
          participantNames,
          participantAvatars,
        });

        // Caller joins the room
        socket.join(roomId);

        // Notify all group members except caller
        memberIds.forEach((memberId) => {
          if (memberId !== callerId) {
            const memberSocketId = onlineUsers.get(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit("group-call:incoming", {
                roomId,
                callerId,
                callerName,
                callerAvatar,
                groupId,
                groupName,
                callType,
              });
            }
          }
        });

        socket.emit("call:room-created", { roomId });
      }
    );

    // Join group call
    socket.on("group-call:join", ({ roomId, userId, userName, userAvatar }) => {
      console.log(
        `[GroupCall] User ${userName} (${userId}) joining room ${roomId}`
      );
      const room = activeRooms.get(roomId);

      if (!room) {
        console.log(`[GroupCall] Room ${roomId} not found`);
        return;
      }

      if (room.participants.includes(userId)) {
        console.log(`[GroupCall] User ${userId} already in room`);
        return;
      }

      // Send existing participants to the new joiner BEFORE adding them
      const existingParticipants = room.participants.map((pId) => ({
        userId: pId,
        userName: room.participantNames?.[pId] || "User",
        userAvatar: room.participantAvatars?.[pId] || "",
      }));

      console.log(
        `[GroupCall] Sending ${existingParticipants.length} existing participants to ${userName}`
      );
      socket.emit("group-call:existing-participants", {
        participants: existingParticipants,
      });

      // Store participant info
      if (!room.participantNames) room.participantNames = {};
      if (!room.participantAvatars) room.participantAvatars = {};
      room.participantNames[userId] = userName;
      room.participantAvatars[userId] = userAvatar;

      // Add to participants and join socket room
      room.participants.push(userId);
      socket.join(roomId);

      console.log(
        `[GroupCall] Room ${roomId} now has ${room.participants.length} participants`
      );

      // Notify ALL existing participants about new member - they will create offers
      existingParticipants.forEach((participant) => {
        const participantSocketId = onlineUsers.get(participant.userId);
        if (participantSocketId) {
          console.log(
            `[GroupCall] Notifying ${participant.userName} about new user ${userName}`
          );
          io.to(participantSocketId).emit("group-call:user-joined", {
            roomId,
            userId,
            userName,
            userAvatar,
          });
        }
      });
    });

    // Leave group call
    socket.on("group-call:leave", ({ roomId, userId }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter((id) => id !== userId);
        socket.leave(roomId);

        // Notify remaining participants
        room.participants.forEach((participantId) => {
          const participantSocketId = onlineUsers.get(participantId);
          if (participantSocketId) {
            io.to(participantSocketId).emit("group-call:user-left", {
              roomId,
              userId,
            });
          }
        });

        // If no participants left, delete room
        if (room.participants.length === 0) {
          activeRooms.delete(roomId);
        }
      }
    });

    // ==================== GROUP CALL WebRTC SIGNALING ====================

    // Group call offer
    socket.on(
      "group-call:offer",
      ({ roomId, offer, targetUserId, senderName }) => {
        console.log(
          `Group call offer from ${socket.userId} to ${targetUserId}`
        );
        const targetSocketId = onlineUsers.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("group-call:offer", {
            roomId,
            offer,
            fromUserId: socket.userId,
            senderName,
          });
        }
      }
    );

    // Group call answer
    socket.on("group-call:answer", ({ roomId, answer, targetUserId }) => {
      console.log(`Group call answer from ${socket.userId} to ${targetUserId}`);
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("group-call:answer", {
          roomId,
          answer,
          fromUserId: socket.userId,
        });
      }
    });

    // Group call ICE candidate
    socket.on(
      "group-call:ice-candidate",
      ({ roomId, candidate, targetUserId }) => {
        const targetSocketId = onlineUsers.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("group-call:ice-candidate", {
            roomId,
            candidate,
            fromUserId: socket.userId,
          });
        }
      }
    );

    // Screen share events
    socket.on(
      "group-call:screen-share-started",
      ({ roomId, userId, userName }) => {
        const room = activeRooms.get(roomId);
        if (room) {
          room.participants.forEach((participantId) => {
            if (participantId !== userId) {
              const participantSocketId = onlineUsers.get(participantId);
              if (participantSocketId) {
                io.to(participantSocketId).emit(
                  "group-call:screen-share-started",
                  {
                    userId,
                    userName,
                  }
                );
              }
            }
          });
        }
      }
    );

    socket.on("group-call:screen-share-stopped", ({ roomId, userId }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        room.participants.forEach((participantId) => {
          if (participantId !== userId) {
            const participantSocketId = onlineUsers.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit(
                "group-call:screen-share-stopped",
                {
                  userId,
                }
              );
            }
          }
        });
      }
    });

    // ==================== PRIVATE CALL WebRTC SIGNALING ====================

    // Send offer to peer
    socket.on("webrtc:offer", ({ roomId, offer, targetUserId }) => {
      console.log(`WebRTC offer from ${socket.userId} to ${targetUserId}`);
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:offer", {
          roomId,
          offer,
          fromUserId: socket.userId,
        });
      } else {
        console.log(`Target user ${targetUserId} not found for offer`);
      }
    });

    // Send answer to peer
    socket.on("webrtc:answer", ({ roomId, answer, targetUserId }) => {
      console.log(`WebRTC answer from ${socket.userId} to ${targetUserId}`);
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:answer", {
          roomId,
          answer,
          fromUserId: socket.userId,
        });
      } else {
        console.log(`Target user ${targetUserId} not found for answer`);
      }
    });

    // Send ICE candidate to peer
    socket.on("webrtc:ice-candidate", ({ roomId, candidate, targetUserId }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:ice-candidate", {
          roomId,
          candidate,
          fromUserId: socket.userId,
        });
      }
    });

    // ==================== DISCONNECT ====================

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);

        // Notify others that user is offline
        socket.broadcast.emit("user:offline", socket.userId);

        // End any active calls this user was in
        activeRooms.forEach((room, roomId) => {
          if (room.participants.includes(socket.userId)) {
            room.participants.forEach((participantId) => {
              if (participantId !== socket.userId) {
                const participantSocketId = onlineUsers.get(participantId);
                if (participantSocketId) {
                  io.to(participantSocketId).emit("call:ended", {
                    roomId,
                    endedBy: socket.userId,
                    reason: "disconnected",
                  });
                }
              }
            });
            activeRooms.delete(roomId);
          }
        });
      }
    });
  });
};
