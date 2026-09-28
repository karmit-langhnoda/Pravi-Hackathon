import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    kind: {
      type: String,
      enum: ['user', 'department', 'location'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startAt: {
      type: Date,
      default: Date.now,
    },
    endAt: Date,
    dueAt: Date,
    status: {
      type: String,
      enum: ['active', 'returned', 'transferred'],
      default: 'active',
    },
    note: String,
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ asset: 1, startAt: -1 });
assignmentSchema.index({ user: 1, status: 1 });
assignmentSchema.index({ status: 1, dueAt: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
