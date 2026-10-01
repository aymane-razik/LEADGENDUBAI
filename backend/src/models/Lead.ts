import { model, Schema, type Document, type Types } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface ILead extends Document {
  source:
    | 'bayut'
    | 'propertyfinder'
    | 'dubizzle'
    | 'facebook'
    | 'instagram'
    | 'landing_page'
    | 'referral'
    | 'manual';
  sourceId?: string;
  capturedAt: Date;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  nationality?: string;
  language?: 'en' | 'ar' | 'ru' | 'other';
  occupation?: string;
  company?: string;
  income?: number;
  employmentStatus?: 'employed' | 'self_employed' | 'business_owner' | 'unemployed' | 'retired';
  propertyType: ('apartment' | 'villa' | 'townhouse' | 'penthouse' | 'commercial' | 'land')[];
  purpose: 'buy' | 'rent' | 'invest' | 'sell';
  budget: {
    min: number;
    max: number;
    currency: 'AED' | 'USD';
  };
  locations: string[];
  bedrooms?: number;
  timeline: 'immediate' | '1-3months' | '3-6months' | '6-12months' | 'flexible';
  financing?: 'cash' | 'mortgage' | 'both';
  score: number;
  quality: 'hot' | 'warm' | 'cold' | 'junk';
  intent: 'high' | 'medium' | 'low';
  urgency: number;
  probability: number;
  enriched: boolean;
  enrichmentData?: {
    linkedinProfile?: string;
    companyInfo?: Record<string, unknown>;
    propertyHistory?: Record<string, unknown>[];
    socialProfiles?: Record<string, unknown>;
    estimatedNetWorth?: number;
  };
  status:
    | 'new'
    | 'contacted'
    | 'qualified'
    | 'meeting_scheduled'
    | 'viewing_done'
    | 'negotiating'
    | 'deal_closed'
    | 'lost'
    | 'nurturing';
  substatus?: string;
  assignedTo?: Types.ObjectId;
  lastContact?: Date;
  nextFollowup?: Date;
  touchpoints: number;
  responseRate: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  tags: string[];
  notes: string;
  customFields: Map<string, unknown>;
  isDuplicate: boolean;
  duplicateOf?: Types.ObjectId;
  duplicateScore?: number;
  isActive: boolean;
  isQualified: boolean;
  isBlacklisted: boolean;
  doNotContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    source: {
      type: String,
      enum: [
        'bayut',
        'propertyfinder',
        'dubizzle',
        'facebook',
        'instagram',
        'landing_page',
        'referral',
        'manual',
      ],
      required: true,
    },
    sourceId: { type: String },
    capturedAt: { type: Date, default: Date.now },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    nationality: { type: String },
    language: { type: String, enum: ['en', 'ar', 'ru', 'other'] },
    occupation: { type: String },
    company: { type: String },
    income: { type: Number, min: 0 },
    employmentStatus: {
      type: String,
      enum: ['employed', 'self_employed', 'business_owner', 'unemployed', 'retired'],
    },
    propertyType: {
      type: [String],
      enum: ['apartment', 'villa', 'townhouse', 'penthouse', 'commercial', 'land'],
      required: true,
    },
    purpose: { type: String, enum: ['buy', 'rent', 'invest', 'sell'], required: true },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, enum: ['AED', 'USD'], required: true, default: 'AED' },
    },
    locations: { type: [String], required: true },
    bedrooms: { type: Number, min: 0 },
    timeline: {
      type: String,
      enum: ['immediate', '1-3months', '3-6months', '6-12months', 'flexible'],
      required: true,
    },
    financing: { type: String, enum: ['cash', 'mortgage', 'both'] },
    score: { type: Number, default: 0, min: 0, max: 100 },
    quality: { type: String, enum: ['hot', 'warm', 'cold', 'junk'], default: 'cold' },
    intent: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
    urgency: { type: Number, default: 1, min: 1, max: 10 },
    probability: { type: Number, default: 0, min: 0, max: 1 },
    enriched: { type: Boolean, default: false },
    enrichmentData: {
      linkedinProfile: { type: String },
      companyInfo: { type: Schema.Types.Mixed },
      propertyHistory: { type: [Schema.Types.Mixed] },
      socialProfiles: { type: Schema.Types.Mixed },
      estimatedNetWorth: { type: Number, min: 0 },
    },
    status: {
      type: String,
      enum: [
        'new',
        'contacted',
        'qualified',
        'meeting_scheduled',
        'viewing_done',
        'negotiating',
        'deal_closed',
        'lost',
        'nurturing',
      ],
      default: 'new',
    },
    substatus: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    lastContact: { type: Date },
    nextFollowup: { type: Date },
    touchpoints: { type: Number, default: 0, min: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 1 },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    utmContent: { type: String },
    referrer: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'] },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    customFields: { type: Map, of: Schema.Types.Mixed, default: new Map<string, unknown>() },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Lead' },
    duplicateScore: { type: Number, min: 0, max: 1 },
    isActive: { type: Boolean, default: true },
    isQualified: { type: Boolean, default: false },
    isBlacklisted: { type: Boolean, default: false },
    doNotContact: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

LeadSchema.index({ email: 1 }, { unique: true });
LeadSchema.index({ phone: 1 }, { unique: true });
LeadSchema.index({ score: -1 });
LeadSchema.index({ status: 1, assignedTo: 1 });
LeadSchema.index({ quality: 1, isActive: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ source: 1, sourceId: 1 });
tenantScopePlugin(LeadSchema);

export const Lead = model<ILead>('Lead', LeadSchema);
