import mongoose from 'mongoose';
import { LOCATION_KINDS } from '../config/constants.js';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: LOCATION_KINDS,
      default: 'other',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    // Materialized path for efficient tree queries: ,id1,id2,id3,
    path: {
      type: String,
      default: ',',
      index: true,
    },
    address: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: build materialized path
locationSchema.pre('save', async function (next) {
  if (this.isModified('parent')) {
    if (this.parent) {
      const parentDoc = await this.constructor.findById(this.parent).lean();
      this.path = parentDoc ? `${parentDoc.path}${this.parent},` : ',';
    } else {
      this.path = ',';
    }
  }
  next();
});

export const Location = mongoose.model('Location', locationSchema);
