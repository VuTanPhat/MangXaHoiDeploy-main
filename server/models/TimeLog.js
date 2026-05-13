import mongoose from "mongoose";

const timeLogSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: String, ref: "User", required: true },
    hours: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const TimeLog = mongoose.model("TimeLog", timeLogSchema);

export default TimeLog;
