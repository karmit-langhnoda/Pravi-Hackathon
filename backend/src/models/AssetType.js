import mongoose from 'mongoose';
import { FIELD_DATA_TYPES } from '../config/constants.js';

// Field definition sub-schema
const fieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      match: /^[a-z][a-z0-9_]*$/,
    },
    label: {
      type: String,
      required: true,
    },
    dataType: {
      type: String,
      enum: FIELD_DATA_TYPES,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    unique: {
      type: Boolean,
      default: false,
    },
    searchable: {
      type: Boolean,
      default: false,
    },
    options: [String], // For select/multiselect
    defaultValue: mongoose.Schema.Types.Mixed,
    validation: {
      min: Number,
      max: Number,
      regex: String,
      maxLength: Number,
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Lifecycle state sub-schema
const stateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#6B7280',
    },
    isInitial: {
      type: Boolean,
      default: false,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// Lifecycle transition sub-schema
const transitionSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approverRole: {
      type: String,
    },
    allowedRoles: [String],
  },
  { _id: true }
);

// Asset Type schema
const assetTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'Package',
    },
    tagFormat: {
      prefix: {
        type: String,
        required: true,
      },
      includeYear: {
        type: Boolean,
        default: true,
      },
      padding: {
        type: Number,
        default: 5,
      },
    },
    fields: [fieldSchema],
    states: [stateSchema],
    transitions: [transitionSchema],
    hierarchy: {
      isContainer: {
        type: Boolean,
        default: false,
      },
      allowedChildTypes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AssetType',
        },
      ],
      inheritLocation: {
        type: Boolean,
        default: false,
      },
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AssetType = mongoose.model('AssetType', assetTypeSchema);
