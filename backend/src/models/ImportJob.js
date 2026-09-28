import mongoose from 'mongoose';

const importJobSchema = new mongoose.Schema(
  {
    assetType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetType',
      required: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'failed'],
      default: 'queued',
    },
    total: {
      type: Number,
      default: 0,
    },
    succeeded: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        row: Number,
        message: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const ImportJob = mongoose.model('ImportJob', importJobSchema);
