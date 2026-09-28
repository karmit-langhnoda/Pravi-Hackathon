import mongoose from 'mongoose';
import { LIFECYCLE_EVENT_KINDS } from '../config/constants.js';

const lifecycleEventSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    kind: {
      type: String,
      enum: LIFECYCLE_EVENT_KINDS,
      required: true,
    },
    fromStatus: String,
    toStatus: String,
    changes: [
      {
        field: String,
        from: mongoose.Schema.Types.Mixed,
        to: mongoose.Schema.Types.Mixed,
      },
    ],
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
    },
    note: String,
    at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No timestamps plugin - uses 'at' field
    versionKey: false,
  }
);

lifecycleEventSchema.index({ asset: 1, at: -1 });

// Block updates and deletes - append only
lifecycleEventSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('LifecycleEvents are append-only and cannot be modified or deleted');
});

export const LifecycleEvent = mongoose.model('LifecycleEvent', lifecycleEventSchema);
