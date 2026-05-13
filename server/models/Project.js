import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    owner: { type: String, ref: "User", required: true },
    members: [
      {
        user: { type: String, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "admin", "member", "viewer"],
          default: "member",
        },
      },
    ],
    methodology: { type: String, enum: ["scrum", "kanban"], default: "scrum" },
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
    },
    start_date: Date,
    end_date: Date,
    settings: {
      sprint_duration: { type: Number, default: 14 },
      story_points_enabled: { type: Boolean, default: true },
      time_tracking_enabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
