import mongoose from 'mongoose';
import { DOCUMENT_CATEGORIES } from '../config/constants.js';

const documentSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['asset', 'assetType', 'global'],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: DOCUMENT_CATEGORIES,
      default: 'other',
    },
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: String,
    size: Number,
    visibleToRoles: [String],
    ingest: {
      status: {
        type: String,
        enum: ['na', 'pending', 'processing', 'ready', 'failed'],
        default: 'na',
      },
      chunkCount: { type: Number, default: 0 },
      error: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);

// Document chunks for RAG
const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: [Number],
    meta: {
      page: Number,
      scope: String,
      refId: mongoose.Schema.Types.ObjectId,
    },
    visibleToRoles: [String],
  },
  { timestamps: true }
);

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
