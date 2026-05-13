import Task from "../models/Task.js";
import Project from "../models/Project.js";
import TaskHandover from "../models/TaskHandover.js";
import TimeLog from "../models/TimeLog.js";
import User from "../models/User.js";
import sendEmail from "../configs/nodeMailer.js";
import { getOnlineUsers, getIO } from "../socket/videoCall.js";

export const createTask = async (req, res) => {
  try {
    const { userId } = req.auth();
    const {
      project,
      title,
      description,
      type,
      priority,
      assignee,
      story_points,
      due_date,
      labels,
      sprint,
      estimated_hours,
    } = req.body;

    const task = await Task.create({
      project,
      title,
      description,
      type,
      priority,
      assignee,
      reporter: userId,
      story_points,
      due_date,
      labels,
      sprint,
      estimated_hours,
      status: "backlog",
    });

    const populatedTask = await Task.findById(task._id).populate(
      "assignee reporter project sprint"
    );

    if (assignee && assignee !== userId) {
      const assigneeUser = await User.findById(assignee);
      const reporterUser = await User.findById(userId);

      await sendEmail({
        to: assigneeUser.email,
        subject: `New Task Assigned: ${task.task_key}`,
        body: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>You have been assigned a new task</h2>
            <p><strong>${task.task_key}:</strong> ${task.title}</p>
            <p><strong>Assigned by:</strong> ${reporterUser.full_name}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Due Date:</strong> ${
              task.due_date
                ? new Date(task.due_date).toLocaleDateString()
                : "Not set"
            }</p>
            ${
              task.description
                ? `<p><strong>Description:</strong> ${task.description}</p>`
                : ""
            }
            <a href="${process.env.FRONTEND_URL}/task/${task._id}" 
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View Task
            </a>
          </div>
        `,
      });
    }

    res.json({ success: true, task: populatedTask });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assignee, sprint, type } = req.query;

    let query = { project: projectId };
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;
    if (sprint) query.sprint = sprint;
    if (type) query.type = type;

    const tasks = await Task.find(query)
      .populate("assignee reporter sprint")
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignee reporter project sprint parent_task")
      .populate("blocked_by blocks");

    if (!task) {
      return res.json({ success: false, message: "Task not found" });
    }

    const timeLogs = await TimeLog.find({ task: taskId })
      .populate("user")
      .sort({ date: -1 });

    res.json({ success: true, task, timeLogs });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.json({ success: false, message: "Task not found" });
    }

    const oldValues = {};
    Object.keys(updates).forEach((key) => {
      if (task[key] !== updates[key]) {
        oldValues[key] = task[key];
        task[key] = updates[key];

        task.history.push({
          user: userId,
          action: `${key}_changed`,
          old_value: String(oldValues[key]),
          new_value: String(updates[key]),
        });
      }
    });

    await task.save();

    const updatedTask = await Task.findById(taskId).populate(
      "assignee reporter project sprint"
    );

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.json({ success: false, message: "Task not found" });
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === "in_progress" && !task.started_at) {
      task.started_at = new Date();
    }
    if (status === "done" && !task.completed_at) {
      task.completed_at = new Date();
    }

    task.history.push({
      user: userId,
      action: "status_changed",
      old_value: oldStatus,
      new_value: status,
    });

    await task.save();

    const updatedTask = await Task.findById(taskId).populate(
      "assignee reporter project sprint"
    );

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.json({ success: false, message: "Task not found" });
    }

    const isOwnerOrReporter =
      task.project.owner === userId || task.reporter === userId;
    if (!isOwnerOrReporter) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    await TimeLog.deleteMany({ task: taskId });
    await TaskHandover.deleteMany({ task: taskId });
    await Task.findByIdAndDelete(taskId);

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const createTaskHandover = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { taskId } = req.params;
    const {
      to_user,
      reason,
      context,
      completed_work,
      pending_work,
      blockers,
      schedule_meeting,
      meeting_date,
    } = req.body;

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.json({ success: false, message: "Task not found" });
    }

    if (task.assignee.toString() !== userId) {
      return res.json({
        success: false,
        message: "You are not assigned to this task",
      });
    }

    const handover = await TaskHandover.create({
      task: taskId,
      from_user: userId,
      to_user,
      reason,
      context,
      completed_work,
      pending_work,
      blockers,
      status: "accepted", // Auto-accept handover
      accepted_at: new Date(),
      handover_meeting: schedule_meeting
        ? {
            scheduled: true,
            date: meeting_date,
          }
        : undefined,
    });

    // Immediately change task assignee
    task.assignee = to_user;
    task.history.push({
      user: userId,
      action: "handover",
      old_value: userId,
      new_value: to_user,
    });
    await task.save();

    const toUser = await User.findById(to_user);
    const fromUser = await User.findById(userId);

    // Try to send email but don't fail if it doesn't work
    try {
      await sendEmail({
        to: toUser.email,
        subject: `Bàn giao công việc: ${task.task_key}`,
        body: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Bạn được giao công việc mới</h2>
            <p><strong>${
              fromUser.full_name
            }</strong> đã bàn giao công việc cho bạn:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>${task.task_key}: ${task.title}</h3>
              <p><strong>Reason:</strong> ${reason}</p>
              ${context ? `<p><strong>Context:</strong> ${context}</p>` : ""}
            </div>

            ${
              completed_work
                ? `<div style="margin: 15px 0;"><h4>✅ Completed Work:</h4><p>${completed_work}</p></div>`
                : ""
            }
            ${
              pending_work
                ? `<div style="margin: 15px 0;"><h4>📋 Pending Work:</h4><p>${pending_work}</p></div>`
                : ""
            }
            ${
              blockers
                ? `<div style="margin: 15px 0; color: #dc2626;"><h4>⚠️ Blockers:</h4><p>${blockers}</p></div>`
                : ""
            }
            ${
              schedule_meeting
                ? `<div style="margin: 15px 0;"><h4>📅 Handover Meeting:</h4><p>${new Date(
                    meeting_date
                  ).toLocaleString()}</p></div>`
                : ""
            }

            <a href="${process.env.FRONTEND_URL}/handover/${handover._id}" 
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Review Handover Request
            </a>
          </div>
        `,
      });
    } catch (emailError) {
      console.log(
        "Email sending failed (SMTP not activated), but handover created:",
        emailError.message
      );
    }

    // Send real-time notification via Socket.IO
    const io = getIO();
    const onlineUsers = getOnlineUsers();
    const toUserSocketId = onlineUsers.get(to_user);

    if (io && toUserSocketId) {
      io.to(toUserSocketId).emit("handover:request", {
        handover: {
          _id: handover._id,
          task: {
            _id: task._id,
            task_key: task.task_key,
            title: task.title,
          },
          from_user: {
            _id: fromUser._id,
            full_name: fromUser.full_name,
            profile_picture: fromUser.profile_picture,
          },
          reason,
          createdAt: handover.createdAt,
        },
      });
      console.log(`Handover notification sent to user ${to_user}`);
    }

    const populatedHandover = await TaskHandover.findById(
      handover._id
    ).populate("task from_user to_user");

    res.json({ success: true, handover: populatedHandover });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const acceptHandover = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { handoverId } = req.params;

    const handover = await TaskHandover.findById(handoverId).populate(
      "task from_user"
    );
    if (!handover) {
      return res.json({ success: false, message: "Handover not found" });
    }

    if (handover.to_user.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    handover.status = "accepted";
    handover.accepted_at = new Date();
    await handover.save();

    const task = await Task.findById(handover.task);
    task.assignee = userId;
    task.history.push({
      user: userId,
      action: "handover_accepted",
      old_value: handover.from_user._id.toString(),
      new_value: userId,
    });
    await task.save();

    const fromUser = await User.findById(handover.from_user);
    const toUser = await User.findById(userId);

    try {
      await sendEmail({
        to: fromUser.email,
        subject: `Handover Accepted: ${task.task_key}`,
        body: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Handover Accepted</h2>
            <p><strong>${toUser.full_name}</strong> has accepted the handover of task ${task.task_key}.</p>
            <a href="${process.env.FRONTEND_URL}/task/${task._id}">View Task</a>
          </div>
        `,
      });
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    res.json({ success: true, message: "Handover accepted" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const rejectHandover = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { handoverId } = req.params;
    const { reason } = req.body;

    const handover = await TaskHandover.findById(handoverId).populate(
      "task from_user"
    );
    if (!handover) {
      return res.json({ success: false, message: "Handover not found" });
    }

    if (handover.to_user.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    handover.status = "rejected";
    handover.rejection_reason = reason;
    await handover.save();

    const fromUser = await User.findById(handover.from_user);
    const toUser = await User.findById(userId);
    const task = await Task.findById(handover.task);

    try {
      await sendEmail({
        to: fromUser.email,
        subject: `Handover Rejected: ${task.task_key}`,
        body: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Handover Rejected</h2>
            <p><strong>${
              toUser.full_name
            }</strong> has rejected the handover of task ${task.task_key}.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <a href="${process.env.FRONTEND_URL}/task/${task._id}">View Task</a>
          </div>
        `,
      });
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    res.json({ success: true, message: "Handover rejected" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserHandovers = async (req, res) => {
  try {
    const { userId } = req.auth();

    const handovers = await TaskHandover.find({
      $or: [{ from_user: userId }, { to_user: userId }],
      status: { $ne: "completed" },
    })
      .populate("task from_user to_user")
      .sort({ createdAt: -1 });

    res.json({ success: true, handovers });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const logTime = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { taskId } = req.params;
    const { hours, description, date } = req.body;

    const timeLog = await TimeLog.create({
      task: taskId,
      user: userId,
      hours,
      description,
      date: date || new Date(),
    });

    const task = await Task.findById(taskId);
    task.actual_hours += hours;
    await task.save();

    const populatedTimeLog = await TimeLog.findById(timeLog._id).populate(
      "user"
    );

    res.json({ success: true, timeLog: populatedTimeLog });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getTaskTimeLogs = async (req, res) => {
  try {
    const { taskId } = req.params;

    const timeLogs = await TimeLog.find({ task: taskId })
      .populate("user")
      .sort({ date: -1 });

    res.json({ success: true, timeLogs });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
