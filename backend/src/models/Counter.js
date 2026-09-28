import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: String, // e.g., "tag:LT:2026"
  seq: {
    type: Number,
    default: 0,
  },
});

export const Counter = mongoose.model('Counter', counterSchema);
