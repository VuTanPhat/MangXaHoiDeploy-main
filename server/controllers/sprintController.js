import Sprint from "../models/Sprint.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

export const createSprint = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { project, name, goal, start_date, end_date, capacity } = req.body;

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.json({ success: false, message: "Project not found" });
    }

    const sprint = await Sprint.create({
      project,
      name,
      goal,
      start_date,
      end_date,
      capacity,
    });

    res.json({ success: true, sprint });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getProjectSprints = async (req, res) => {
  try {
    const { projectId } = req.params;

    const sprints = await Sprint.find({ project: projectId }).sort({
      start_date: -1,
    });

    res.json({ success: true, sprints });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getSprintById = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId).populate("project");
    if (!sprint) {
      return res.json({ success: false, message: "Sprint not found" });
    }

    const tasks = await Task.find({ sprint: sprintId }).populate(
      "assignee reporter"
    );

    const stats = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((t) => t.status === "done").length,
      in_progress_tasks: tasks.filter((t) => t.status === "in_progress").length,
      blocked_tasks: tasks.filter((t) => t.status === "blocked").length,
      total_story_points: tasks.reduce(
        (sum, t) => sum + (t.story_points || 0),
        0
      ),
      completed_story_points: tasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.story_points || 0), 0),
    };

    res.json({ success: true, sprint, tasks, stats });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateSprint = async (req, res) => {
  try {
    const { sprintId } = req.params;
    const updates = req.body;

    const sprint = await Sprint.findByIdAndUpdate(sprintId, updates, {
      new: true,
    });
    if (!sprint) {
      return res.json({ success: false, message: "Sprint not found" });
    }

    res.json({ success: true, sprint });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const startSprint = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.json({ success: false, message: "Sprint not found" });
    }

    sprint.status = "active";
    await sprint.save();

    res.json({ success: true, sprint });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const completeSprint = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.json({ success: false, message: "Sprint not found" });
    }

    const tasks = await Task.find({ sprint: sprintId });
    const completedStoryPoints = tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    sprint.status = "completed";
    sprint.velocity = completedStoryPoints;
    await sprint.save();

    res.json({ success: true, sprint });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getSprintBurndown = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.json({ success: false, message: "Sprint not found" });
    }

    const tasks = await Task.find({ sprint: sprintId });
    const totalStoryPoints = tasks.reduce(
      (sum, t) => sum + (t.story_points || 0),
      0
    );

    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const burndownData = [];
    for (let day = 0; day <= totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      const completedByDate = tasks
        .filter(
          (t) => t.completed_at && new Date(t.completed_at) <= currentDate
        )
        .reduce((sum, t) => sum + (t.story_points || 0), 0);

      burndownData.push({
        day: `Day ${day}`,
        date: currentDate.toISOString().split("T")[0],
        ideal: totalStoryPoints - (totalStoryPoints / totalDays) * day,
        actual: totalStoryPoints - completedByDate,
      });
    }

    res.json({ success: true, burndownData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
