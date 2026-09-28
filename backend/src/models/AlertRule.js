import mongoose from 'mongoose';
import { ALERT_TRIGGER_KINDS, NOTIFICATION_CHANNELS } from '../config/constants.js';

const alertRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    trigger: {
      kind: {
        type: String,
        enum: ALERT_TRIGGER_KINDS,
        required: true,
      },
      daysBefore: {
        type: Number,
        default: 30,
      },
      fieldKey: String, // for custom_date
    },
    assetTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AssetType' }],
    channels: [{ type: String, enum: NOTIFICATION_CHANNELS }],
    recipients: {
      roles: [String],
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      assignee: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRunAt: Date,
  },
  { timestamps: true }
);

export const AlertRule = mongoose.model('AlertRule', alertRuleSchema);

// Notification model
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    kind: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: String,
    link: {
      entityKind: String,
      entityId: mongoose.Schema.Types.ObjectId,
    },
    readAt: Date,
    dedupeKey: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
// TTL: 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);
