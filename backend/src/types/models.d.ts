import type { Types } from 'mongoose';

export type LeadSource =
  | 'bayut'
  | 'propertyfinder'
  | 'dubizzle'
  | 'facebook'
  | 'instagram'
  | 'landing_page'
  | 'referral'
  | 'manual';

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'townhouse'
  | 'penthouse'
  | 'commercial'
  | 'land';

export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer';

export interface BaseMongoDoc {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
