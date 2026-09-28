import mongoose from 'mongoose';
import { MAINTENANCE_KINDS, MAINTENANCE_STATUSES } from '../config/constants.js';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    kind: {
      type: String,
      enum: MAINTENANCE_KINDS,
      required: true,
    },
    status: {
      type: String,
      enum: MAINTENANCE_STATUSES,
      default: 'scheduled',
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    scheduledFor: Date,
    startedAt: Date,
    completedAt: Date,
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vendor: String,
    cost: {
      type: Number,
      default: 0,
    },
    recurrence: {
      everyDays: Number,
    },
    nextDueAt: Date,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

maintenanceRecordSchema.index({ asset: 1, scheduledFor: -1 });
maintenanceRecordSchema.index({ status: 1, nextDueAt: 1 });
maintenanceRecordSchema.index({ technician: 1, status: 1 });

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
