import { model, Schema, type Document } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface IWebhookSubscription extends Document {
  tenantId: string;
  url: string;
  encryptedSecret: string;
  events: string[];
  active: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSubscriptionSchema = new Schema<IWebhookSubscription>({
  url: { type: String, required: true, maxlength: 2048 },
  encryptedSecret: { type: String, required: true, select: false },
  events: { type: [String], required: true, validate: [(value: string[]) => value.length > 0, 'At least one event is required'] },
  active: { type: Boolean, default: true, index: true },
  createdBy: { type: String },
}, { timestamps: true });

WebhookSubscriptionSchema.index({ tenantId: 1, active: 1, createdAt: -1 });
tenantScopePlugin(WebhookSubscriptionSchema);

export const WebhookSubscriptionModel = model<IWebhookSubscription>('WebhookSubscription', WebhookSubscriptionSchema);
