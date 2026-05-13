import Group from "../models/Group.js";
import Message from "../models/Message.js";
import imagekit from "../configs/imageKit.js";
import fs from "fs";
import { connections } from "./messageController.js"; // nếu export được, hoặc copy logic SSE sang đây

// Tạo group mới
export const createGroup = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { name, member_ids } = req.body; // member_ids: array userId

    if (!name || !member_ids || member_ids.length === 0) {
      return res.json({ success: false, message: "Invalid payload" });
    }

    // đảm bảo người tạo cũng là member
    const uniqueMembers = Array.from(new Set([...member_ids, userId]));

    const group = await Group.create({
      name,
      admins: [userId],
      members: uniqueMembers,
    });

    res.json({ success: true, group });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy danh sách group mà user đang tham gia
export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.auth();

    const groups = await Group.find({ members: userId });

    res.json({ success: true, groups });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy tin nhắn trong 1 group
export const getGroupMessages = async (req, res) => {
  try {
    const { group_id } = req.body;

    const messages = await Message.find({ group_id })
      .populate("from_user_id")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Gửi tin nhắn trong nhóm (text + image tương tự sendMessage)
export const sendGroupMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { group_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";
    let imagekit_file_id = "";

    if (!group_id) {
      return res.json({ success: false, message: "group_id is required" });
    }

    // upload ảnh nếu có
    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path);

      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });

      imagekit_file_id = response.fileId;

      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    const message = await Message.create({
      from_user_id: userId,
      group_id,
      text,
      message_type,
      media_url,
      imagekit_file_id,
    });

    res.json({ success: true, message });

    // gửi tin qua SSE cho tất cả members trong group
    const group = await Group.findById(group_id);

    if (group) {
      const populatedMessage = await Message.findById(message._id).populate(
        "from_user_id"
      );

      group.members
        .filter((memberId) => memberId !== userId)
        .forEach((memberId) => {
          if (connections[memberId]) {
            connections[memberId].write(
              `data: ${JSON.stringify(populatedMessage)}\n\n`
            );
          }
        });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
