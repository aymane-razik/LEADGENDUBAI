import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(5000),
  API_VERSION: Joi.string().default('v1'),
  MONGODB_URI: Joi.string().required(),
  MONGODB_TEST_URI: Joi.string().required(),
  DATABASE_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().required(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().min(0).default(0),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRE: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRE: Joi.string().required(),
  JWT_RESET_SECRET: Joi.string().min(16).required(),
  JWT_RESET_EXPIRE: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().required(),
  SMTP_SECURE: Joi.boolean().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().required(),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().required(),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).required(),
  ENCRYPTION_KEY: Joi.string().min(16).required(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE_PATH: Joi.string().required(),
  TZ: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
  MAX_FILE_SIZE: Joi.number().integer().positive().required(),
  UPLOAD_PATH: Joi.string().required(),
})
  .unknown(true)
  .required();

const { error, value } = envSchema.validate(process.env, { abortEarly: false, convert: true });
if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

export interface EnvConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  MONGODB_TEST_URI: string;
  DATABASE_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;
  JWT_RESET_SECRET: string;
  JWT_RESET_EXPIRE: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  BCRYPT_ROUNDS: number;
  ENCRYPTION_KEY: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FILE_PATH: string;
  TZ: string;
  FRONTEND_URL: string;
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
}

export const env: EnvConfig = value as EnvConfig;
