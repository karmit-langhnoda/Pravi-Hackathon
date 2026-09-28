import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB connection failed');
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB connection error');
});

export { mongoose };
