import { model, Schema, type Document, type Types } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface ICampaign extends Document {
  name: string;
  description?: string;
  type: 'email' | 'whatsapp' | 'sms' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  targeting: {
    filters: Record<string, unknown>;
    segmentId?: Types.ObjectId;
    includeLeadIds?: Types.ObjectId[];
    excludeLeadIds?: Types.ObjectId[];
    maxRecipients?: number;
  };
  content: {
    subject?: string;
    body: string;
    template?: string;
    variables?: Map<string, string>;
    attachments?: string[];
  };
  schedule: {
    type: 'immediate' | 'scheduled' | 'drip' | 'triggered';
    startDate?: Date;
    endDate?: Date;
    timezone: string;
    sequences?: {
      step: number;
      delay: number;
      condition?: Record<string, unknown>;
      content: Record<string, unknown>;
    }[];
  };
  metrics: {
    targetCount: number;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
    unsubscribed: number;
    converted: number;
    revenue?: number;
  };
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    allowUnsubscribe: boolean;
    replyToEmail?: string;
    senderId?: string;
  };
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ['email', 'whatsapp', 'sms', 'multi_channel'], required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
    },
    targeting: {
      filters: { type: Schema.Types.Mixed, default: {} },
      segmentId: { type: Schema.Types.ObjectId },
      includeLeadIds: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
      excludeLeadIds: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
      maxRecipients: { type: Number, min: 1 },
    },
    content: {
      subject: { type: String },
      body: { type: String, required: true },
      template: { type: String },
      variables: { type: Map, of: String },
      attachments: { type: [String] },
    },
    schedule: {
      type: { type: String, enum: ['immediate', 'scheduled', 'drip', 'triggered'], required: true },
      startDate: { type: Date },
      endDate: { type: Date },
      timezone: { type: String, required: true, default: 'Asia/Dubai' },
      sequences: [
        {
          step: { type: Number, required: true },
          delay: { type: Number, required: true },
          condition: { type: Schema.Types.Mixed },
          content: { type: Schema.Types.Mixed, required: true },
        },
      ],
    },
    metrics: {
      targetCount: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      replied: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
      revenue: { type: Number, min: 0 },
    },
    settings: {
      trackOpens: { type: Boolean, default: true },
      trackClicks: { type: Boolean, default: true },
      allowUnsubscribe: { type: Boolean, default: true },
      replyToEmail: { type: String },
      senderId: { type: String },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

CampaignSchema.index({ status: 1, createdAt: -1 });
CampaignSchema.index({ type: 1, status: 1 });
CampaignSchema.index({ createdBy: 1 });
tenantScopePlugin(CampaignSchema);

export const Campaign = model<ICampaign>('Campaign', CampaignSchema);
