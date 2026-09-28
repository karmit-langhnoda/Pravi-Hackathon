import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        sources: [
          {
            kind: String,
            refId: mongoose.Schema.Types.ObjectId,
            label: String,
          },
        ],
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// TTL index: auto-delete sessions older than 90 days
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
