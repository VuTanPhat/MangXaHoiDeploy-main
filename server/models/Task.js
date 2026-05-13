import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: "Sprint" },

    title: { type: String, required: true },
    description: { type: String },
    task_key: { type: String, unique: true },

    type: {
      type: String,
      enum: ["story", "task", "bug", "epic"],
      default: "task",
    },
    priority: {
      type: String,
      enum: ["lowest", "low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "backlog",
        "todo",
        "in_progress",
        "in_review",
        "testing",
        "done",
        "blocked",
      ],
      default: "backlog",
    },

    assignee: { type: String, ref: "User" },
    reporter: { type: String, ref: "User", required: true },
    watchers: [{ type: String, ref: "User" }],

    story_points: { type: Number, min: 0, max: 100 },
    estimated_hours: { type: Number },
    actual_hours: { type: Number, default: 0 },

    due_date: Date,
    started_at: Date,
    completed_at: Date,

    parent_task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    blocked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    blocks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],

    attachments: [
      {
        name: String,
        url: String,
        type: String,
        uploaded_by: { type: String, ref: "User" },
        uploaded_at: { type: Date, default: Date.now },
      },
    ],

    labels: [String],

    history: [
      {
        user: { type: String, ref: "User" },
        action: String,
        old_value: String,
        new_value: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

taskSchema.pre("save", async function (next) {
  if (!this.task_key && this.isNew) {
    const Project = mongoose.model("Project");
    const project = await Project.findById(this.project);
    const count = await mongoose
      .model("Task")
      .countDocuments({ project: this.project });
    this.task_key = `${project.key}-${count + 1}`;
  }
  next();
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
