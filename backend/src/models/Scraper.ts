import { model, Schema, type Document, type Types } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface IScraper extends Document {
  name: string;
  source:
    | 'bayut'
    | 'propertyfinder'
    | 'dubizzle'
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'custom';
  type: 'property' | 'lead' | 'agent' | 'market_data';
  config: {
    url: string;
    method?: 'GET' | 'POST';
    selectors?: Map<string, string>;
    xpaths?: Map<string, string>;
    apiEndpoint?: string;
    headers?: Map<string, string>;
    cookies?: Map<string, string>;
    pagination?: {
      type: 'page' | 'scroll' | 'api';
      selector?: string;
      maxPages?: number;
    };
    filters?: Record<string, unknown>;
    proxy?: string;
    userAgent?: string;
  };
  schedule: string;
  timezone: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'error' | 'paused';
  lastRun?: {
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    itemsFound: number;
    itemsProcessed: number;
    itemsCreated: number;
    itemsUpdated: number;
    itemsSkipped: number;
    errors: {
      message: string;
      count: number;
      lastOccurred: Date;
    }[];
    status: 'success' | 'partial' | 'failed';
  };
  metrics: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalItems: number;
    avgDuration: number;
    avgItemsPerRun: number;
    successRate: number;
    lastSuccessAt?: Date;
  };
  settings: {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    concurrency: number;
    respectRobotsTxt: boolean;
    rateLimit?: {
      requests: number;
      period: number;
    };
  };
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    emailTo?: string[];
  };
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScraperSchema = new Schema<IScraper>(
  {
    name: { type: String, required: true },
    source: {
      type: String,
      enum: ['bayut', 'propertyfinder', 'dubizzle', 'facebook', 'instagram', 'linkedin', 'custom'],
      required: true,
    },
    type: { type: String, enum: ['property', 'lead', 'agent', 'market_data'], required: true },
    config: {
      url: { type: String, required: true },
      method: { type: String, enum: ['GET', 'POST'] },
      selectors: { type: Map, of: String },
      xpaths: { type: Map, of: String },
      apiEndpoint: { type: String },
      headers: { type: Map, of: String },
      cookies: { type: Map, of: String },
      pagination: {
        type: { type: String, enum: ['page', 'scroll', 'api'] },
        selector: { type: String },
        maxPages: { type: Number, min: 1 },
      },
      filters: { type: Schema.Types.Mixed },
      proxy: { type: String },
      userAgent: { type: String },
    },
    schedule: { type: String, required: true },
    timezone: { type: String, required: true, default: 'Asia/Dubai' },
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: ['idle', 'running', 'error', 'paused'], default: 'idle' },
    lastRun: {
      startedAt: { type: Date },
      completedAt: { type: Date },
      duration: { type: Number },
      itemsFound: { type: Number },
      itemsProcessed: { type: Number },
      itemsCreated: { type: Number },
      itemsUpdated: { type: Number },
      itemsSkipped: { type: Number },
      errors: [
        {
          message: { type: String, required: true },
          count: { type: Number, required: true },
          lastOccurred: { type: Date, required: true },
        },
      ],
      status: { type: String, enum: ['success', 'partial', 'failed'] },
    },
    metrics: {
      totalRuns: { type: Number, default: 0 },
      successfulRuns: { type: Number, default: 0 },
      failedRuns: { type: Number, default: 0 },
      totalItems: { type: Number, default: 0 },
      avgDuration: { type: Number, default: 0 },
      avgItemsPerRun: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      lastSuccessAt: { type: Date },
    },
    settings: {
      retryAttempts: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 10 },
      timeout: { type: Number, default: 60 },
      concurrency: { type: Number, default: 1 },
      respectRobotsTxt: { type: Boolean, default: true },
      rateLimit: {
        requests: { type: Number },
        period: { type: Number },
      },
    },
    notifications: {
      onSuccess: { type: Boolean, default: false },
      onError: { type: Boolean, default: true },
      emailTo: { type: [String] },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ScraperSchema.index({ source: 1, type: 1 });
ScraperSchema.index({ status: 1, enabled: 1 });
ScraperSchema.index({ schedule: 1, enabled: 1 });
tenantScopePlugin(ScraperSchema);

export const Scraper = model<IScraper>('Scraper', ScraperSchema);
