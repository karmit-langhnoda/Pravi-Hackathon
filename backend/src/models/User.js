import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    employeeId: {
      type: String,
      trim: true,
    },
    scope: {
      locations: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location',
        },
      ],
      assetTypes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AssetType',
        },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLoginAt: Date,
    failedLogins: {
      type: Number,
      default: 0,
    },
    lockedUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
userSchema.index({ department: 1, status: 1 });

export const User = mongoose.model('User', userSchema);
