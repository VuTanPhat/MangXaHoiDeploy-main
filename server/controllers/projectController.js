import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

export const createProject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const {
      name,
      key,
      description,
      methodology,
      start_date,
      end_date,
      member_ids,
    } = req.body;

    const existingProject = await Project.findOne({ key });
    if (existingProject) {
      return res.json({
        success: false,
        message: "Project key already exists",
      });
    }

    const members = [{ user: userId, role: "owner" }];
    if (member_ids && member_ids.length > 0) {
      member_ids.forEach((id) => {
        if (id !== userId) {
          members.push({ user: id, role: "member" });
        }
      });
    }

    const project = await Project.create({
      name,
      key: key.toUpperCase(),
      description,
      owner: userId,
      members,
      methodology,
      start_date,
      end_date,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("owner")
      .populate("members.user");

    res.json({ success: true, project: populatedProject });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.auth();

    const projects = await Project.find({
      $or: [{ owner: userId }, { "members.user": userId }],
      status: { $ne: "archived" },
    })
      .populate("owner")
      .populate("members.user")
      .sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("owner")
      .populate("members.user");

    if (!project) {
      return res.json({ success: false, message: "Project not found" });
    }

    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          story_points: { $sum: "$story_points" },
        },
      },
    ]);

    res.json({ success: true, project, taskStats });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;
    const updates = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.json({ success: false, message: "Project not found" });
    }

    const isOwnerOrAdmin =
      project.owner === userId ||
      project.members.some(
        (m) => m.user.toString() === userId && m.role === "admin"
      );

    if (!isOwnerOrAdmin) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    Object.assign(project, updates);
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate("owner")
      .populate("members.user");

    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;
    const { user_id, role = "member" } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.json({ success: false, message: "Project not found" });
    }

    if (project.owner !== userId) {
      return res.json({
        success: false,
        message: "Only project owner can add members",
      });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === user_id
    );
    if (alreadyMember) {
      return res.json({ success: false, message: "User is already a member" });
    }

    project.members.push({ user: user_id, role });
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate("owner")
      .populate("members.user");

    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const removeProjectMember = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { projectId, memberId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.json({ success: false, message: "Project not found" });
    }

    if (project.owner !== userId) {
      return res.json({
        success: false,
        message: "Only project owner can remove members",
      });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== memberId
    );
    await project.save();

    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.json({ success: false, message: "Project not found" });
    }

    if (project.owner.toString() !== userId) {
      return res.json({
        success: false,
        message: "Only project owner can delete this project",
      });
    }

    await Task.deleteMany({ project: projectId });

    await Project.findByIdAndDelete(projectId);

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("owner")
      .populate("members.user")
      .sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const adminDeleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.json({ success: false, message: "Project not found" });
    }

    await Task.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);

    res.json({ success: true, message: "Project deleted by admin" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
