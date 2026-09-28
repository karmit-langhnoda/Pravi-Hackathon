import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['contract', 'internal', 'client'], default: 'contract' },
  status: { type: String, enum: ['active', 'completed', 'on_hold', 'cancelled'], default: 'active' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);
