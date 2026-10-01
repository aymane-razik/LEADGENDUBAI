import { model, Schema, type Document, type Types } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface IActivity extends Document {
  leadId: Types.ObjectId;
  type:
    | 'call'
    | 'email'
    | 'whatsapp'
    | 'sms'
    | 'meeting'
    | 'viewing'
    | 'note'
    | 'status_change'
    | 'document'
    | 'task';
  channel?: 'phone' | 'email' | 'whatsapp' | 'sms' | 'in_person' | 'video_call';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response';
  nextAction?: string;
  metadata?: {
    duration?: number;
    emailId?: string;
    messageId?: string;
    attachments?: string[];
    propertyIds?: Types.ObjectId[];
  };
  performedBy: Types.ObjectId;
  relatedTo?: Types.ObjectId;
  scheduledAt?: Date;
  completedAt?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    type: {
      type: String,
      enum: [
        'call',
        'email',
        'whatsapp',
        'sms',
        'meeting',
        'viewing',
        'note',
        'status_change',
        'document',
        'task',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['phone', 'email', 'whatsapp', 'sms', 'in_person', 'video_call'],
    },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    subject: { type: String },
    content: { type: String, required: true },
    outcome: { type: String, enum: ['positive', 'neutral', 'negative', 'no_response'] },
    nextAction: { type: String },
    metadata: {
      duration: { type: Number, min: 0 },
      emailId: { type: String },
      messageId: { type: String },
      attachments: { type: [String] },
      propertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    relatedTo: { type: Schema.Types.ObjectId },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ActivitySchema.index({ leadId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, completedAt: -1 });
ActivitySchema.index({ performedBy: 1, createdAt: -1 });
ActivitySchema.index({ scheduledAt: 1, isCompleted: 1 });
tenantScopePlugin(ActivitySchema);

export const Activity = model<IActivity>('Activity', ActivitySchema);
