import { model, Schema, type Document } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface IWebhookDelivery extends Document {
  deliveryId: string;
  subscriptionId: string;
  eventId: string;
  eventType: string;
  attempt: number;
  status: 'pending' | 'delivered' | 'failed';
  responseStatus?: number;
  errorMessage?: string;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>({
  deliveryId: { type: String, required: true, unique: true },
  subscriptionId: { type: String, required: true, index: true },
  eventId: { type: String, required: true },
  eventType: { type: String, required: true },
  attempt: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'delivered', 'failed'], required: true },
  responseStatus: { type: Number },
  errorMessage: { type: String, maxlength: 1000 },
  nextRetryAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

WebhookDeliverySchema.index({ tenantId: 1, subscriptionId: 1, createdAt: -1 });
tenantScopePlugin(WebhookDeliverySchema);

export const WebhookDeliveryModel = model<IWebhookDelivery>('WebhookDelivery', WebhookDeliverySchema);
