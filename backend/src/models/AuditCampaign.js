import mongoose from 'mongoose';

const auditCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    scope: {
      locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
      assetTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AssetType' }],
      departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
      containers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
    },
    auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startedAt: Date,
    closedAt: Date,
    summary: {
      expected: { type: Number, default: 0 },
      found: { type: Number, default: 0 },
      missing: { type: Number, default: 0 },
      misplaced: { type: Number, default: 0 },
      unexpected: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const AuditCampaign = mongoose.model('AuditCampaign', auditCampaignSchema);

// Audit item schema
const auditItemSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditCampaign',
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    expectedLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    result: {
      type: String,
      enum: ['pending', 'found', 'missing', 'misplaced', 'unexpected'],
      default: 'pending',
    },
    foundLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    scannedAt: Date,
    note: String,
  },
  { timestamps: true }
);

auditItemSchema.index({ campaign: 1, asset: 1 }, { unique: true });
auditItemSchema.index({ campaign: 1, result: 1 });

export const AuditItem = mongoose.model('AuditItem', auditItemSchema);
