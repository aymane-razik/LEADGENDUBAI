export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: string; details?: unknown };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: string[];
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  team?: string;
  isVerified?: boolean;
  settings?: {
    notifications: { email: boolean; sms: boolean; push: boolean; leadAssignment: boolean; dailyDigest: boolean };
    preferences: { language: 'en' | 'ar'; timezone: string; dateFormat: string; theme: 'light' | 'dark' };
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'manager' | 'agent' | 'viewer';
}

export interface LoginInput {
  email: string;
  password: string;
}

// Leads
export type LeadSource = 'bayut' | 'propertyfinder' | 'dubizzle' | 'facebook' | 'instagram' | 'landing_page' | 'referral' | 'manual';
export type LeadPropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'commercial' | 'land';
export type LeadPurpose = 'buy' | 'rent' | 'invest' | 'sell';
export type LeadTimeline = 'immediate' | '1-3months' | '3-6months' | '6-12months' | 'flexible';
export type LeadFinancing = 'cash' | 'mortgage' | 'both';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_scheduled' | 'viewing_done' | 'negotiating' | 'deal_closed' | 'lost' | 'nurturing';
export type LeadQuality = 'hot' | 'warm' | 'cold' | 'junk';
export type LeadIntent = 'high' | 'medium' | 'low';
export type LeadLanguage = 'en' | 'ar' | 'ru' | 'other';
export type EmploymentStatus = 'employed' | 'self_employed' | 'business_owner' | 'unemployed' | 'retired';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';
export type Currency = 'AED' | 'USD';

export interface LeadBudget {
  min: number;
  max: number;
  currency: Currency;
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
  enrichmentData?: {
    linkedinProfile?: string;
    companyInfo?: Record<string, unknown>;
    propertyHistory?: Record<string, unknown>[];
    socialProfiles?: Record<string, unknown>;
    estimatedNetWorth?: number;
  };
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
}

export interface ScoreFactors {
  budget: number;
  timeline: number;
  purpose: number;
  source: number;
  completeness: number;
  responseRate: number;
  enrichment: number;
  engagement: number;
}

export interface ScoreExplainResult {
  id: string;
  score: number;
  maxPossible: number;
  profile: string;
  factors: ScoreFactors;
}

export interface DuplicateMatch {
  leadId: string;
  similarity: number;
  factors: {
    email: boolean;
    phone: boolean;
    whatsapp: boolean;
    nameSimilarity: number;
    budgetOverlap: boolean;
    propertyTypeOverlap: boolean;
    locationOverlap: boolean;
  };
  matchedFields: string[];
  explanation: string;
}

export interface DuplicateMergeResult {
  primaryId: string;
  mergedId: string;
  similarity: number;
  mergedFields: string[];
}

export interface CreateLeadInput {
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
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: LeadStatus;
  substatus?: string;
  assignedTo?: string;
}

// Properties
export type PropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'commercial' | 'land';
export type PropertyPurpose = 'sale' | 'rent';
export type PropertyFurnishing = 'furnished' | 'unfurnished' | 'semi-furnished';
export type PropertySource = 'bayut' | 'propertyfinder' | 'dubizzle' | 'manual';

export interface PropertyLocation {
  area: string;
  subArea?: string;
  building?: string;
  street?: string;
  city: string;
  country: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface PropertyListItem {
  id: string;
  source: PropertySource;
  sourceId: string;
  url: string;
  title: string;
  description: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  category?: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  price: number;
  pricePerSqft: number;
  currency: Currency;
  location: PropertyLocation;
  amenities: string[];
  furnishing: PropertyFurnishing;
  parking: number;
  view?: string;
  floor?: number;
  totalFloors?: number;
  unitNumber?: string;
  developer?: string;
  completionStatus?: 'ready' | 'off_plan';
  handoverDate?: string;
  images: string[];
  videos: string[];
  virtualTour?: string;
  floorPlan?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agency?: string;
  isOwner: boolean;
  permitNumber?: string;
  views: number;
  inquiries: number;
  favorites: number;
  listedDate: string;
  lastUpdated: string;
  refreshedAt?: string;
  priceHistory: Array<{ price: number; date: string; changePercent: number }>;
  marketTrend: 'increasing' | 'stable' | 'decreasing';
  daysOnMarket: number;
  competitorCount?: number;
  avgAreaPrice?: number;
  priceComparison?: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  isPremium: boolean;
  scrapedAt: string;
  lastScrapedAt: string;
  scrapingErrors?: string[];
}

export interface CreatePropertyInput {
  source: PropertySource;
  sourceId: string;
  url: string;
  title: string;
  description: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  category?: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  price: number;
  pricePerSqft: number;
  currency: Currency;
  location: PropertyLocation;
  amenities?: string[];
  furnishing: PropertyFurnishing;
  parking?: number;
  view?: string;
  floor?: number;
  totalFloors?: number;
  unitNumber?: string;
  developer?: string;
  completionStatus?: 'ready' | 'off_plan';
  handoverDate?: string;
  images?: string[];
  videos?: string[];
  virtualTour?: string;
  floorPlan?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agency?: string;
  isOwner?: boolean;
  permitNumber?: string;
  views?: number;
  inquiries?: number;
  favorites?: number;
  listedDate?: string;
  lastUpdated?: string;
  scrapedAt?: string;
  lastScrapedAt?: string;
}

export interface PriceTrendRow {
  _id: string;
  avgPrice: number;
  count: number;
}

// Campaigns
export type CampaignType = 'email' | 'whatsapp' | 'sms' | 'multi_channel';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignScheduleType = 'immediate' | 'scheduled' | 'drip' | 'triggered';

export interface CampaignListItem {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  targeting: {
    filters: Record<string, unknown>;
    segmentId?: string;
    includeLeadIds?: string[];
    excludeLeadIds?: string[];
    maxRecipients?: number;
  };
  content: {
    subject?: string;
    body: string;
    template?: string;
    variables?: Record<string, string>;
    attachments?: string[];
  };
  schedule: {
    type: CampaignScheduleType;
    startDate?: string;
    endDate?: string;
    timezone: string;
    sequences?: Array<{
      step: number;
      delay: number;
      condition?: Record<string, unknown>;
      content: Record<string, unknown>;
    }>;
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
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CampaignDripStep {
  step: number;
  scheduledAt: string;
  condition?: string;
}

export interface CampaignEligibilityResult {
  leadId: string;
  eligible: boolean;
  recipient: {
    leadId: string;
    channel: 'email' | 'sms' | 'whatsapp';
    contact: string;
    optedIn: boolean;
    suppressed: boolean;
    suppressionReason?: string;
  };
}

// Users / agents
export interface UserListItem {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  title?: string;
  department?: string;
  team?: string;
  isActive: boolean;
  isVerified: boolean;
  isOnline: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMetrics {
  leadsAssigned: number;
  leadsContacted: number;
  leadsQualified: number;
  leadsConverted: number;
  conversionRate: number;
  avgResponseTime: number;
  avgDealValue: number;
  totalRevenue: number;
  activitiesLogged: number;
}

// Activities
export type ActivityType = 'call' | 'email' | 'whatsapp' | 'sms' | 'meeting' | 'viewing' | 'note' | 'status_change' | 'document' | 'task';
export type ActivityChannel = 'phone' | 'email' | 'whatsapp' | 'sms' | 'in_person' | 'video_call';
export type ActivityDirection = 'inbound' | 'outbound';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative' | 'no_response';

export interface ActivityListItem {
  id: string;
  leadId: string;
  type: ActivityType;
  channel?: ActivityChannel;
  direction: ActivityDirection;
  subject?: string;
  content: string;
  outcome?: ActivityOutcome;
  nextAction?: string;
  metadata?: {
    duration?: number;
    emailId?: string;
    messageId?: string;
    attachments?: string[];
    propertyIds?: string[];
  };
  performedBy: string;
  relatedTo?: string;
  scheduledAt?: string;
  completedAt?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Scrapers
export type ScraperSource = 'bayut' | 'propertyfinder' | 'dubizzle' | 'facebook' | 'instagram' | 'linkedin' | 'custom';
export type ScraperType = 'property' | 'lead' | 'agent' | 'market_data';
export type ScraperStatus = ScraperListItem['status'];

export interface ScraperListItem {
  id: string;
  name: string;
  source: ScraperSource;
  type: ScraperType;
  config: {
    url: string;
    method?: 'GET' | 'POST';
    selectors?: Record<string, string>;
    xpaths?: Record<string, string>;
    apiEndpoint?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
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
    startedAt: string;
    completedAt?: string;
    duration?: number;
    itemsFound: number;
    itemsProcessed: number;
    itemsCreated: number;
    itemsUpdated: number;
    itemsSkipped: number;
    errors: Array<{ message: string; count: number; lastOccurred: string }>;
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
    lastSuccessAt?: string;
  };
  settings: {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    concurrency: number;
    respectRobotsTxt: boolean;
    rateLimit?: { requests: number; period: number };
  };
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    emailTo?: string[];
  };
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics
export interface DashboardStats {
  leads: LeadStats;
  properties: PropertyStats;
  campaigns: CampaignStats;
}

export interface LeadStats {
  total: number;
  active: number;
  hot: number;
  qualified: number;
  converted: number;
  byQuality: Record<string, number>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byAssignment: Record<string, number>;
}

export interface PropertyStats {
  total: number;
  active: number;
  featured: number;
  byType: Record<string, number>;
  byPurpose: Record<string, number>;
  byArea: Record<string, number>;
  totalListingsValue: number;
}

export interface CampaignStats {
  total: number;
  active: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalSent: number;
  totalDelivered: number;
  totalOpen: number;
  totalClicked: number;
  totalConverted: number;
  totalRevenue: number;
}

// Webhooks
export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

// Outbox
export interface OutboxStatus {
  pending: number;
}
