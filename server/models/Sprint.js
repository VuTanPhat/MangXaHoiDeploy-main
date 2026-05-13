import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: { type: String, required: true },
    goal: { type: String },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning",
    },
    velocity: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;
