import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../utils';

let retries = 0;
const maxRetries = 5;
const retryDelayMs = 5000;

const getMongoUri = (): string =>
  env.NODE_ENV === 'test' ? env.MONGODB_TEST_URI : env.MONGODB_URI;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(getMongoUri(), {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
    retries = 0;
    logger.info('MongoDB connected', { host: connection.connection.host });
    return connection;
  } catch (error) {
    retries += 1;
    logger.error('MongoDB connection failed', { retries, error });
    if (retries >= maxRetries) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return connectDatabase();
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
