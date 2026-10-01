import { model, Schema, type Document, type Types } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

export interface IUser extends Document {
  tenantId: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: string[];
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  title?: string;
  department?: string;
  reportsTo?: Types.ObjectId;
  team?: string;
  assignment?: {
    capacity: number;
    territory: string[];
    propertyTypes: string[];
    preferredTimeline: string[];
  };
  settings: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      leadAssignment: boolean;
      dailyDigest: boolean;
    };
    dashboard: {
      defaultView: string;
      widgets: string[];
    };
    preferences: {
      language: 'en' | 'ar';
      timezone: string;
      dateFormat: string;
      theme: 'light' | 'dark';
    };
  };
  metrics: {
    leadsAssigned: number;
    leadsContacted: number;
    leadsQualified: number;
    leadsConverted: number;
    conversionRate: number;
    avgResponseTime: number;
    avgDealValue: number;
    totalRevenue: number;
    activitiesLogged: number;
  };
  lastLogin?: Date;
  lastLoginIP?: string;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  passwordChangedAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  refreshTokens: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isActive: boolean;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['admin', 'manager', 'agent', 'viewer'], default: 'agent' },
    permissions: { type: [String], default: [] },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    title: { type: String },
    department: { type: String },
    reportsTo: { type: Schema.Types.ObjectId, ref: 'User' },
    team: { type: String },
    assignment: {
      capacity: { type: Number, min: 1, default: 25 },
      territory: { type: [String], default: [] },
      propertyTypes: { type: [String], default: [] },
      preferredTimeline: { type: [String], default: [] },
    },
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        leadAssignment: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: true },
      },
      dashboard: {
        defaultView: { type: String, default: 'overview' },
        widgets: { type: [String], default: ['pipeline', 'activities', 'performance'] },
      },
      preferences: {
        language: { type: String, enum: ['en', 'ar'], default: 'en' },
        timezone: { type: String, default: 'Asia/Dubai' },
        dateFormat: { type: String, default: 'YYYY-MM-DD' },
        theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
      },
    },
    metrics: {
      leadsAssigned: { type: Number, default: 0 },
      leadsContacted: { type: Number, default: 0 },
      leadsQualified: { type: Number, default: 0 },
      leadsConverted: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      avgDealValue: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      activitiesLogged: { type: Number, default: 0 },
    },
    lastLogin: { type: Date },
    lastLoginIP: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    passwordChangedAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    refreshTokens: { type: [String], default: [] },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ team: 1 });
tenantScopePlugin(UserSchema);

export const User = model<IUser>('User', UserSchema);
