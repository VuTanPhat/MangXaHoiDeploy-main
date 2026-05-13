import User from "../models/User.js";
import Post from "../models/Post.js";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import Comment from "../models/Comment.js";

// Lấy thống kê dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalGroups = await Group.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isActive: false });

    // Thống kê users mới trong 7 ngày gần đây
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Thống kê posts mới trong 7 ngày gần đây
    const newPostsThisWeek = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalMessages,
        totalGroups,
        activeUsers,
        blockedUsers,
        newUsersThisWeek,
        newPostsThisWeek,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách tất cả users với phân trang và tìm kiếm
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;

    let query = {};

    // Tìm kiếm theo tên, email, username
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Filter theo trạng thái
    if (status === "active") {
      query.isActive = true;
    } else if (status === "blocked") {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Khóa/Mở khóa tài khoản user
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: adminId } = req.auth();

    // Không cho phép admin tự khóa chính mình
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể khóa tài khoản của chính mình",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Không cho phép khóa admin khác
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Không thể khóa tài khoản admin khác",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa user (và tất cả dữ liệu liên quan)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userId: adminId } = req.auth();

    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể xóa tài khoản của chính mình",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa tài khoản admin",
      });
    }

    // Xóa tất cả posts của user
    await Post.deleteMany({ user: userId });

    // Xóa tất cả comments của user
    await Comment.deleteMany({ user: userId });

    // Xóa tất cả messages của user
    await Message.deleteMany({
      $or: [{ from_user_id: userId }, { to_user_id: userId }],
    });

    // Xóa user khỏi connections, followers, following của users khác
    await User.updateMany(
      {},
      {
        $pull: {
          connections: userId,
          followers: userId,
          following: userId,
        },
      }
    );

    // Xóa user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Đã xóa người dùng và tất cả dữ liệu liên quan",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thay đổi role của user
export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const { userId: adminId } = req.auth();

    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể thay đổi role của chính mình",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ",
      });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      success: true,
      message: `Đã thay đổi role thành ${role}`,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tất cả bài viết với phân trang
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", userId = "" } = req.query;

    let query = {};

    if (search) {
      query.content = { $regex: search, $options: "i" };
    }

    if (userId) {
      query.user = userId;
    }

    const posts = await Post.find(query)
      .populate("user", "full_name username profile_picture email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa bài viết (admin)
export const deletePostByAdmin = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Xóa tất cả comments của post
    await Comment.deleteMany({ post: postId });

    // Xóa post
    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: "Đã xóa bài viết",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết một user
export const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Đếm số bài viết của user
    const postsCount = await Post.countDocuments({ user: userId });

    res.json({
      success: true,
      user,
      postsCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
