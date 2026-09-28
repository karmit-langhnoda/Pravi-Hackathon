import mongoose from 'mongoose';
import { REQUEST_KINDS, REQUEST_STATUSES } from '../config/constants.js';

const requestSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: REQUEST_KINDS,
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
    requestedType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetType',
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payload: mongoose.Schema.Types.Mixed,
    reason: String,
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'pending',
    },
    steps: [
      {
        role: String,
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        decision: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        comment: String,
        decidedAt: Date,
      },
    ],
    currentStep: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

requestSchema.index({ status: 1, 'steps.role': 1 });
requestSchema.index({ requester: 1, createdAt: -1 });

export const Request = mongoose.model('Request', requestSchema);
