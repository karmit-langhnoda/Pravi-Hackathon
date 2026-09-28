import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    assetType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetType',
      required: true,
    },
    typeVersion: {
      type: Number,
      default: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
    },
    // Dynamic attributes validated against the type definition
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      minimize: false,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    assignment: {
      kind: {
        type: String,
        enum: ['user', 'department', 'location', null],
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
      since: Date,
      dueAt: Date,
    },
    purchase: {
      date: Date,
      cost: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      vendor: String,
      invoiceNo: String,
      poNumber: String,
    },
    warranty: {
      start: Date,
      end: Date,
      amcEnd: Date,
    },
    // Parent container (only for child assets)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    childCount: {
      type: Number,
      default: 0,
    },
    tags: [String],
    qrCode: String, // Base64 or storage key
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // uses __v for optimistic locking
  }
);

// Indexes per spec
assetSchema.index({ isArchived: 1, createdAt: -1, _id: -1 });
assetSchema.index({ assetType: 1, status: 1 });
assetSchema.index({ location: 1, status: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ 'assignment.user': 1 });
assetSchema.index({ 'warranty.end': 1 });
assetSchema.index({ name: 'text', assetTag: 'text' });
assetSchema.index({ 'attributes.$**': 1 }); // wildcard index
assetSchema.index({ parent: 1, name: 1 });
assetSchema.index({ project: 1 });

export const Asset = mongoose.model('Asset', assetSchema);
