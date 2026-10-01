import type { ILead } from '../models';

export type LeadSource =
  | 'bayut'
  | 'propertyfinder'
  | 'dubizzle'
  | 'facebook'
  | 'instagram'
  | 'landing_page'
  | 'referral'
  | 'manual';

export type LeadPropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'commercial' | 'land';

export type LeadPurpose = 'buy' | 'rent' | 'invest' | 'sell';

export type LeadTimeline = 'immediate' | '1-3months' | '3-6months' | '6-12months' | 'flexible';

export type LeadFinancing = 'cash' | 'mortgage' | 'both';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'meeting_scheduled'
  | 'viewing_done'
  | 'negotiating'
  | 'deal_closed'
  | 'lost'
  | 'nurturing';

export type LeadQuality = 'hot' | 'warm' | 'cold' | 'junk';

export type LeadIntent = 'high' | 'medium' | 'low';

export type LeadLanguage = 'en' | 'ar' | 'ru' | 'other';

export type EmploymentStatus = 'employed' | 'self_employed' | 'business_owner' | 'unemployed' | 'retired';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export type Currency = 'AED' | 'USD';

export interface BudgetRange {
  min: number;
  max: number;
  currency: Currency;
}

export interface LeadBudget {
  min: number;
  max: number;
  currency: Currency;
}

export interface Location {
  area: string;
  subArea?: string;
  city?: string;
  country?: string;
}

export interface EnrichmentData {
  linkedinProfile?: string;
  companyInfo?: Record<string, unknown>;
  propertyHistory?: Record<string, unknown>[];
  socialProfiles?: Record<string, unknown>;
  estimatedNetWorth?: number;
}

export interface CreateLeadDto {
  source: LeadSource;
  sourceId?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  nationality?: string;
  language?: LeadLanguage;
  occupation?: string;
  company?: string;
  income?: number;
  employmentStatus?: EmploymentStatus;
  propertyType: LeadPropertyType[];
  purpose: LeadPurpose;
  budget: LeadBudget;
  locations: string[];
  bedrooms?: number;
  timeline: LeadTimeline;
  financing?: LeadFinancing;
  responseRate?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  tags?: string[];
  notes?: string;
  tenantId: string;
}

export interface UpdateLeadDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  nationality?: string;
  language?: LeadLanguage;
  occupation?: string;
  company?: string;
  income?: number;
  employmentStatus?: EmploymentStatus;
  propertyType?: LeadPropertyType[];
  purpose?: LeadPurpose;
  budget?: LeadBudget;
  locations?: string[];
  bedrooms?: number;
  timeline?: LeadTimeline;
  financing?: LeadFinancing;
  notes?: string;
  tags?: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  tenantId?: string;
}

export interface LeadStatusTransitionDto {
  status: LeadStatus;
  reason?: string;
}

export interface AssignLeadDto {
  userId: string;
  reason?: string;
}

export interface EnrichLeadDto {
  enrichmentData: EnrichmentData;
  reason?: string;
}

export interface LeadListItem {
  id: string;
  source: LeadSource;
  sourceId?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  language?: LeadLanguage;
  propertyType: LeadPropertyType[];
  purpose: LeadPurpose;
  budget: LeadBudget;
  locations: string[];
  timeline: LeadTimeline;
  score: number;
  quality: LeadQuality;
  intent: LeadIntent;
  urgency: number;
  probability: number;
  status: LeadStatus;
  substatus?: string;
  assignedTo?: string;
  assignedToName?: string;
  lastContact?: string;
  nextFollowup?: string;
  touchpoints: number;
  responseRate: number;
  enriched: boolean;
  tags: string[];
  isDuplicate: boolean;
  duplicateOf?: string;
  duplicateScore?: number;
  isActive: boolean;
  isQualified: boolean;
  isBlacklisted: boolean;
  doNotContact: boolean;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDetail extends LeadListItem {
  nationality?: string;
  occupation?: string;
  company?: string;
  income?: number;
  employmentStatus?: EmploymentStatus;
  bedrooms?: number;
  financing?: LeadFinancing;
  enrichmentData?: EnrichmentData;
  customFields?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  notes: string;
  reassignedFrom?: string;
  reassignedTo?: string;
  previousStatus?: LeadStatus;
  scoreHistory?: ScoreEntry[];
}

export interface ScoreEntry {
  at: string;
  score: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  contribution: number;
  previousValue: number;
  newValue: number;
  reason?: string;
}

export interface DuplicateMatch {
  leadId: string;
  lead: LeadListItem;
  similarity: number;
  matchedFields: string[];
  reason: string;
}

export interface DeduplicationResult {
  primaryId: string;
  mergedId: string;
  similarity: number;
  mergedFields: string[];
  auditEntryId: string;
}

export type SortField = 'createdAt' | 'updatedAt' | 'score' | 'status' | 'quality' | 'assignedTo' | 'lastContact' | 'nextFollowup';

export type SortOrder = 'asc' | 'desc';

export interface LeadQuery {
  page?: number;
  limit?: number;
  sort?: string;
  status?: LeadStatus[];
  quality?: LeadQuality[];
  intent?: LeadIntent[];
  source?: LeadSource[];
  assignedTo?: string;
  unassigned?: boolean;
  search?: string;
  timeline?: LeadTimeline[];
  propertyType?: LeadPropertyType[];
  purpose?: LeadPurpose[];
  minScore?: number;
  maxScore?: number;
  dateFrom?: string;
  dateTo?: string;
  enriched?: boolean;
  inactive?: boolean;
  blacklist?: boolean;
  dnc?: boolean;
  duplicate?: boolean;
  tenantId?: string;
  withRole?: boolean;
}
