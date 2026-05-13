import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: "" }, // optional: ảnh nhóm
    admins: [{ type: String, ref: "User" }], // ai là admin
    members: [{ type: String, ref: "User" }], // tất cả thành viên
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
