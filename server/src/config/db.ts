import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== 'production',
    });
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('Mongo connection failed', error);
    process.exit(1);
  }
};
