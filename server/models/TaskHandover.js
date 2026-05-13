import mongoose from "mongoose";

const taskHandoverSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    from_user: { type: String, ref: "User", required: true },
    to_user: { type: String, ref: "User", required: true },

    reason: { type: String, required: true },
    context: { type: String },

    completed_work: { type: String },
    pending_work: { type: String },
    blockers: { type: String },
    resources: [
      {
        title: String,
        url: String,
      },
    ],

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    accepted_at: Date,
    completed_at: Date,
    rejection_reason: String,

    handover_meeting: {
      scheduled: { type: Boolean, default: false },
      date: Date,
      notes: String,
    },
  },
  { timestamps: true }
);

const TaskHandover = mongoose.model("TaskHandover", taskHandoverSchema);

export default TaskHandover;
