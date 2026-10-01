// Seed script entry: runs from backend folder via 'npm run seed:demo'
// Expects process.env.MONGODB_URI to be set.

import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const env = {
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/dubai-realestate',
} as const;

import { User, Lead, Property, Campaign, Activity, Scraper, WebhookDeliveryModel, WebhookSubscriptionModel } from '../src/models';
import { analyticsMaterialized } from '../src/analytics/materialized';
import { encrypt } from '../src/utils';
import { calculateLeadScore, classifyQuality, classifyIntent, calculateUrgency, calculateProbability, defaultScoringProfile } from '../src/domain/lead/scoring';
import type { Lead } from '../src/models';
import type { Property } from '../src/models';
import type { Campaign } from '../src/models';
import type { Scraper } from '../src/models';
import type { Activity } from '../src/models';
import type { User } from '../src/models';

const DIGITS = '0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PHONE_PREFIXES = ['50', '55', '56', '58', '4xxx', '3xxx'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => {
  const prefix = randomChoice(PHONE_PREFIXES);
  const suffix = Array.from({ length: 7 }, () => randomChoice(DIGITS)).join('');
  if (prefix.startsWith('4') || prefix.startsWith('3')) {
    return `+971${prefix.replace(/x/g, () => randomChoice(DIGITS))}${suffix.slice(0, 7)}`;
  }
  return `+971${prefix}${suffix}`;
};
let emailCounter = 0;
const randomEmail = (name: string) => {
  emailCounter += 1;
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me', 'dubaimail.ae'];
  return `${name.toLowerCase().replace(/\s/g, '')}${emailCounter}@${randomChoice(domains)}`;
};
const randomUAEPhone = () => randomPhone();
const randomDateBetween = (from: Date, to: Date) => {
  const t = from.getTime() + Math.random() * (to.getTime() - from.getTime());
  return new Date(t);
};
const pick = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const FIRST_NAMES_AR = [
  'Ahmed', 'Sara', 'Omar', 'Fatima', 'Mohammed', 'Aisha', 'Khalid', 'Noor',
  'Ali', 'Maryam', 'Hassan', 'Zainab', 'Faisal', 'Layla', 'Rashid', 'Maha',
  'Saeed', 'Salma', 'Tariq', 'Reem', 'Yousuf', 'Mona', 'Ibrahim', 'Danah',
];
const LAST_NAMES_AR = [
  'Al Mansoori', 'Al Maktoum', 'Al Falasi', 'Al Badawi', 'Al Rostamani',
  'Salim', 'Hassani', 'Karim', 'Nassar', 'Obaidli', 'Saeedi', 'Hamdan',
  'Khatib', 'Shamsi', 'Al Ali', 'Al Muhairi', 'Al Falasi', 'Al Qassab',
  'Matar', 'Behbehani',
];
const LOCALITIES = [
  'Downtown Dubai', 'Dubai Marina', 'Jumeirah Village Circle', 'Business Bay',
  'Palm Jumeirah', 'Jumeirah Lake Towers', 'Dubai Hills Estate', 'Arabian Ranches',
  'Meydan', 'Al Barsha', 'Jumeirah 1', 'Jumeirah 2', 'Sports City', 'Arjan',
  'International City', 'Discovery Gardens', 'Emaar Village', 'The Springs',
  'The Meadows', 'Mudon',
];
const PROPERTY_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'commercial', 'land'] as const;
const PURPOSES = ['buy', 'rent', 'invest', 'sell'] as const;
const TIMELINES = ['immediate', '1-3months', '3-6months', '6-12months', 'flexible'] as const;
const SOURCES = ['bayut', 'propertyfinder', 'dubizzle', 'facebook', 'instagram', 'landing_page', 'referral', 'manual'] as const;
const STATUSES = ['new', 'contacted', 'qualified', 'meeting_scheduled', 'viewing_done', 'negotiating', 'deal_closed', 'lost', 'nurturing'] as const;
const QUALITIES = ['hot', 'warm', 'cold', 'junk'] as const;
const INTENTS = ['high', 'medium', 'low'] as const;
const EMPLOYMENT_STATUSES = ['employed', 'self_employed', 'business_owner', 'unemployed', 'retired'] as const;
const AGENT_TITLES = [
  'Senior Sales Executive', 'Real Estate Broker', 'Sales Agent', 'Property Consultant',
  'Luxury Homes Specialist', 'Leasing Advisor', 'Investment Advisor', 'Marketing Executive',
];
const PROPERTY_PHOTOS = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85',
];

const fakeUser = (overrides: Record<string, unknown> = {}) => ({
  email: overrides.email ?? `user-${randomInt(10000, 99999)}@example.com`,
  password: 'Demo@123456', // hashed before insert in main()
  firstName: overrides.firstName ?? randomChoice(FIRST_NAMES_AR),
  lastName: overrides.lastName ?? randomChoice(LAST_NAMES_AR),
  role: overrides.role ?? 'agent',
  phone: overrides.phone ?? randomUAEPhone(),
  title: overrides.title ?? randomChoice(AGENT_TITLES),
  department: overrides.department ?? randomChoice(['Sales', 'Leasing', 'Investments', 'Marketing']),
  team: overrides.team ?? randomChoice(['Dubai Marina Team', 'Downtown Team', 'Palm Team', 'Business Bay Team']),
  isActive: true,
  isVerified: true,
  isOnline: Math.random() > 0.5,
  permissions: overrides.permissions ?? [],
  metrics: {
    leadsAssigned: 0,
    leadsContacted: 0,
    leadsQualified: 0,
    leadsConverted: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    avgDealValue: 0,
    totalRevenue: 0,
    activitiesLogged: 0,
  },
  ...overrides,
});

const fakeLead = (overrides: Record<string, unknown> = {}): Partial<Lead> => {
  const firstName = overrides.firstName ?? randomChoice(FIRST_NAMES_AR);
  const lastName = overrides.lastName ?? randomChoice(LAST_NAMES_AR);
  const budgetMax = randomChoice([500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000, 7500000, 10000000]);
  const budgetMin = Math.round(budgetMax * randomChoice([0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8]));
  const timeline = randomChoice(TIMELINES);
  const purpose = randomChoice(PURPOSES);
  const propTypes = pick(PROPERTY_TYPES, randomInt(1, 3));
  const locs = pick(LOCALITIES, randomInt(1, 3));
  return {
    source: overrides.source ?? randomChoice(SOURCES),
    sourceId: overrides.sourceId ?? crypto.randomUUID(),
    firstName,
    lastName,
    email: overrides.email ?? randomEmail(firstName),
    phone: overrides.phone ?? randomUAEPhone(),
    whatsapp: overrides.whatsapp ?? (Math.random() > 0.3 ? randomUAEPhone() : undefined),
    nationality: randomChoice(['UAE', 'India', 'Pakistan', 'UK', 'Philippines', 'Egypt', 'Saudi Arabia', 'USA', 'Canada', 'Australia', 'Russia', 'China']),
    language: randomChoice(['en', 'ar', 'ru']),
    occupation: randomChoice(['Engineer', 'Doctor', 'Business Owner', 'Manager', 'Teacher', 'Banker', 'Consultant', 'Executive', 'Student', 'Retired', 'Self-employed', 'Investor']),
    company: Math.random() > 0.4 ? `${randomChoice(['Aldar', 'Emaar', 'Nakheel', 'Dubai Properties', 'Meraas', 'EMAAR', 'DFM', 'ADNOC', 'Etisalat', 'du'])} ${randomChoice(['Group', 'LLC', 'FZE', ' FZ', 'Holding', 'Tech', 'Capital'])}` : undefined,
    income: randomChoice([15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000]),
    employmentStatus: randomChoice(EMPLOYMENT_STATUSES),
    propertyType: propTypes,
    purpose,
    budget: { min: budgetMin, max: budgetMax, currency: 'AED' },
    locations: locs,
    bedrooms: randomChoice([0, 1, 2, 3, 4, 5]),
    timeline,
    financing: randomChoice(['cash', 'mortgage', 'both']),
    capturedAt: randomDateBetween(new Date('2025-09-01'), new Date()),
    responseRate: randomChoice([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]),
    tags: randomChoice([
      ['VIP', 'Urgent'],
      ['Investor'],
      ['First-time buyer'],
      ['Sell-side'],
      ['Off-plan interest'],
      ['Ready property'],
    ], 1),
    notes: '',
    utmSource: randomChoice(['google', 'facebook', 'instagram', 'linkedin', 'direct', 'referral', 'bayut', 'propertyfinder']),
    utmMedium: randomChoice(['cpc', 'social', 'organic', 'email', 'referral']),
    utmCampaign: randomChoice(['dubai-spring-2025', 'marina-launch', 'villa-deals', 'investor-webinar', 'downtown-premium']),
    deviceType: randomChoice(['mobile', 'desktop', 'tablet']),
    ipAddress: '10.0.0.' + randomInt(1, 254),
    userAgent: randomChoice([
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
      'Mozilla/5.0 (Linux; Android 14)',
    ]),
    ...overrides,
  };
};

const fakeProperty = (overrides: Record<string, unknown> = {}): Partial<Property> => {
  const type = overrides.type ?? randomChoice(PROPERTY_TYPES);
  const purpose = overrides.purpose ?? randomChoice(['sale', 'rent']);
  const areaPrice = randomChoice([800, 1000, 1200, 1500, 1800, 2000, 2500, 3000]);
  const size = randomChoice([
    type === 'villa' ? randomChoice([2500, 3000, 4000, 5000, 6000, 8000]) :
    type === 'townhouse' ? randomChoice([1500, 2000, 2500, 3000]) :
    type === 'penthouse' ? randomChoice([1500, 2000, 2500, 3000, 4000]) :
    type === 'commercial' ? randomChoice([1000, 2000, 3000, 4000, 5000]) :
    randomChoice([500, 700, 900, 1000, 1200, 1500, 1800]),
  ]);
  const pricePerSqft = type === 'land' ? randomChoice([100, 200, 300, 400, 500]) : areaPrice + randomInt(-200, 200);
  const basePrice = Math.round(size * pricePerSqft * randomChoice([0.9, 1.0, 1.1]));
  return {
    source: overrides.source ?? randomChoice(['bayut', 'propertyfinder', 'dubizzle', 'manual']),
    sourceId: overrides.sourceId ?? crypto.randomUUID(),
    url: overrides.url ?? `https://example.com/property/${crypto.randomUUID().slice(0, 8)}`,
    title: overrides.title ?? `${type.charAt(0).toUpperCase() + type.slice(1)} in ${randomChoice(LOCALITIES)}`,
    description: overrides.description ?? `Beautiful ${type} located in ${randomChoice(LOCALITIES)}. Modern finishings, great community, close to amenities. ${randomChoice(['Delivered', 'Under construction', 'Off-plan'])}.` ,
    type,
    purpose,
    bedrooms: type === 'land' ? 0 : type === 'commercial' ? 0 : randomChoice([1, 2, 3, 4, 5]),
    bathrooms: type === 'land' ? 0 : type === 'commercial' ? 1 : randomChoice([1, 2, 3, 4]),
    size,
    price: basePrice,
    pricePerSqft,
    currency: 'AED',
    location: {
      area: randomChoice(LOCALITIES),
      city: 'Dubai',
      country: 'UAE',
      coordinates: { type: 'Point', coordinates: [randomChoice([55.1, 55.2, 55.3, 55.4]), randomChoice([25.1, 25.2, 25.3, 25.4, 25.5])] },
    },
    furnishing: randomChoice(['furnished', 'unfurnished', 'semi-furnished']),
    parking: randomChoice([0, 1, 2, 3]),
    view: randomChoice([undefined, 'City', 'Sea', 'Park', 'Golf'] as const),
    completionStatus: randomChoice(['ready', 'off_plan']),
    agentName: randomChoice(FIRST_NAMES_AR) + ' ' + randomChoice(LAST_NAMES_AR),
    agentPhone: randomUAEPhone(),
    agency: randomChoice(['Emaar', 'Aldar', 'Dubai Properties', 'Meraas', 'Select Group', 'Better Homes', 'Allsopp & Allsopp', 'Haus & Haus', 'Future Homes', 'Husn Al Arab']),
    isOwner: Math.random() > 0.85,
    views: randomInt(0, 5000),
    inquiries: randomInt(0, 300),
    favorites: randomInt(0, 1000),
    listedDate: randomDateBetween(new Date('2025-06-01'), new Date()),
    lastUpdated: new Date(),
    scrapedAt: randomDateBetween(new Date('2025-06-01'), new Date()),
    lastScrapedAt: new Date(),
    isActive: true,
    isFeatured: Math.random() > 0.85,
    isVerified: Math.random() > 0.4,
    isPremium: Math.random() > 0.9,
    marketTrend: randomChoice(['increasing', 'stable', 'decreasing']),
    daysOnMarket: randomInt(0, 180),
    avgAreaPrice: areaPrice,
    priceComparison: randomChoice([-10, -5, -2, 0, 2, 5, 10, 15]),
    images: (() => {
      const start = randomInt(0, PROPERTY_PHOTOS.length - 1);
      return Array.from({ length: 3 }, (_, index) => PROPERTY_PHOTOS[(start + index) % PROPERTY_PHOTOS.length]);
    })(),
    priceHistory: [
      { price: basePrice, date: new Date(), changePercent: 0 },
      { price: Math.round(basePrice * 0.98), date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), changePercent: -2 },
      { price: Math.round(basePrice * 0.96), date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), changePercent: -2 },
    ],
    ...overrides,
  };
};

const fakeCampaign = (overrides: Record<string, unknown> = {}): Partial<Campaign> => {
  const type = overrides.type ?? randomChoice(['email', 'whatsapp', 'sms', 'multi_channel']);
  const status = overrides.status ?? randomChoice(['draft', 'active', 'paused', 'completed', 'archived']);
  const name = overrides.name ?? `${randomChoice(['Dubai Spring Offer', 'Marina Launch', 'Villa Deals', 'Investor Webinar', 'Downtown Premium', 'Off-plan Open House', 'New Listing Alert', 'Welcome Series', 'Follow-up Sequence', 'Re-engagement'])}`;
  return {
    name,
    description: `Automated ${type} campaign targeting ${randomChoice(LOCALITIES)} leads.`,
    type,
    status,
    targeting: {
      filters: {
        purpose: randomChoice(PURPOSES),
        source: randomChoice(SOURCES),
        timeline: randomChoice(TIMELINES),
      },
      maxRecipients: randomChoice([100, 200, 500, 1000, 2000]),
    },
    content: {
      subject: randomChoice(['Exclusive Dubai property opportunities', 'Your dream home awaits', 'Limited time offer', 'Investor exclusive', 'New launch alert']),
      body: `Dear {{firstName}}, we found ${randomChoice(LOCALITIES)} properties matching your criteria. Reply to learn more.`,
      template: randomChoice(['standard', 'welcome', 'followup', 'offer']),
      variables: {
        firstName: '{{lead.firstName}}',
        location: '{{lead.locations[0]}}',
        budget: '{{lead.budget.max}}',
      },
    },
    schedule: {
      type: randomChoice(['immediate', 'scheduled', 'drip', 'triggered']),
      startDate: status !== 'draft' ? new Date(Date.now() - randomInt(0, 60) * 24 * 60 * 60 * 1000) : new Date(Date.now() + randomInt(1, 14) * 24 * 60 * 60 * 1000),
      timezone: 'Asia/Dubai',
      sequences: status === 'drip' ? [
        { step: 1, delay: 0, content: { body: 'First message', subject: 'Subject 1' } },
        { step: 2, delay: 24, content: { body: 'Follow-up 1', subject: 'Subject 2' } },
        { step: 3, delay: 48, content: { body: 'Final follow-up', subject: 'Subject 3' } },
      ] : [],
    },
    metrics: {
      targetCount: randomChoice([50, 100, 200, 500]),
      sent: status === 'active' || status === 'completed' || status === 'archived' ? randomInt(10, 500) : 0,
      delivered: status === 'active' || status === 'completed' || status === 'archived' ? randomInt(5, 450) : 0,
      failed: randomInt(0, 20),
      opened: randomInt(0, 200),
      clicked: randomInt(0, 100),
      replied: randomInt(0, 50),
      unsubscribed: randomInt(0, 10),
      converted: randomInt(0, 30),
      revenue: randomInt(0, 5000000),
    },
    settings: {
      trackOpens: true,
      trackClicks: true,
      allowUnsubscribe: true,
      replyToEmail: `noreply@dubairealestate.com`,
      senderId: 'Dubai Real Estate',
    },
    createdBy: overrides.createdBy ?? undefined,
    ...overrides,
  };
};

const fakeActivity = (leadId: mongoose.Types.ObjectId, performedBy: mongoose.Types.ObjectId, overrides: Record<string, unknown> = {}): Partial<Activity> => {
  const type = randomChoice(['call', 'email', 'whatsapp', 'sms', 'meeting', 'viewing', 'note'] as const);
  const direction = randomChoice(['inbound', 'outbound'] as const);
  return {
    leadId,
    type,
    channel: type === 'call' ? 'phone' : type === 'email' ? 'email' : type === 'whatsapp' ? 'whatsapp' : type === 'sms' ? 'sms' : type === 'meeting' || type === 'viewing' ? 'in_person' : undefined,
    direction,
    subject: randomChoice([
      'Follow-up call',
      'Property viewing scheduled',
      'Negotiation update',
      'Introduction call',
      'Answering queries',
      'Site visit',
      'Contract discussion',
    ]),
    content: randomChoice([
      'Discussed property options in Dubai Marina.',
      'Client is interested in 2-bedroom apartments under AED 1.5M.',
      'Scheduled viewing for next week.',
      'Followed up on WhatsApp, no response yet.',
      'Client wants to visit downtown and marina properties.',
      'Discussed financing options and mortgage.',
      'Client meeting confirmed for Saturday.',
      'Sent property brochures via email.',
      'Client visited the site and liked the view.',
      'Negotiations ongoing, price discussion in progress.',
    ]),
    outcome: randomChoice(['positive', 'neutral', 'negative', 'no_response']),
    nextAction: randomChoice([
      'Send property listings',
      'Schedule viewing',
      'Follow up in 3 days',
      'Share mortgage options',
      'Prepare comparison sheet',
    ]),
    metadata: type === 'call' ? { duration: randomInt(5, 60) } : type === 'email' ? { emailId: crypto.randomUUID() } : type === 'whatsapp' || type === 'sms' ? { messageId: crypto.randomUUID() } : undefined,
    performedBy,
    scheduledAt: type === 'meeting' || type === 'viewing' ? new Date(Date.now() + randomInt(1, 14) * 24 * 60 * 60 * 1000) : undefined,
    completedAt: type !== 'meeting' && type !== 'viewing' ? new Date() : undefined,
    isCompleted: type !== 'meeting' && type !== 'viewing',
    ...overrides,
  };
};

const fakeScraper = (overrides: Record<string, unknown> = {}): Partial<Scraper> => ({
  name: overrides.name ?? randomChoice([
    'Bayut Dubai Properties',
    'Property Finder Listings',
    'Dubizzle Homes',
    'Instagram Lead Capture',
    'Facebook Lead Ads',
    'LinkedIn Agent Profiles',
  ]),
  source: overrides.source ?? randomChoice(['bayut', 'propertyfinder', 'dubizzle', 'facebook', 'instagram', 'linkedin', 'custom'] as const),
  type: overrides.type ?? randomChoice(['property', 'lead', 'agent', 'market_data'] as const),
  config: {
    url: overrides.url ?? `https://example.com/source/${crypto.randomUUID().slice(0, 8)}`,
    method: 'GET',
    selectors: {
      title: 'h1.property-title',
      price: '.price',
      bedrooms: '.bedrooms',
      bathrooms: '.bathrooms',
      size: '.size',
      location: '.location',
    },
    pagination: { type: 'page', maxPages: 10 },
    filters: { city: 'Dubai', type: 'for-sale' },
    proxy: 'http://proxy.example.com:8080',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  schedule: '0 */6 * * *',
  timezone: 'Asia/Dubai',
  enabled: true,
  status: 'idle',
  settings: {
    retryAttempts: 3,
    retryDelay: 10,
    timeout: 60,
    concurrency: 2,
    respectRobotsTxt: true,
    rateLimit: { requests: 10, period: 60 },
  },
  notifications: { onSuccess: true, onError: true, emailTo: ['admin@dubairealestate.com'] },
  createdBy: overrides.createdBy ?? undefined,
  isActive: true,
  ...overrides,
});

const fakeWebhook = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  url: overrides.url ?? `https://demo-endpoint-${randomInt(10000, 99999)}.example.invalid/webhooks`,
  secret: overrides.secret ?? crypto.randomBytes(32).toString('hex'),
  events: overrides.events ?? pick([
    'lead.created', 'lead.assigned', 'lead.status_changed', 'lead.enriched',
    'property.scraped', 'property.updated', 'campaign.message_dispatched',
    'campaign.batch_dispatched', 'scraper.run_completed', 'scraper.run_failed',
  ], randomInt(2, 5)),
  active: false,
  tenantId: 'default',
  createdAt: new Date(),
  ...overrides,
});

const main = async () => {
  console.log('========================================');
  console.log(' Dubai RealEstate LeadGen Demo Seeder');
  console.log('========================================');

  const databaseName = decodeURIComponent(new URL(env.MONGODB_URI).pathname.slice(1));
  if (databaseName !== 'dubai-realestate-demo') {
    throw new Error(`Refusing to seed database "${databaseName}". The demo seeder is restricted to dubai-realestate-demo.`);
  }
  // Keep the same story and counts on every recording while preserving unique Mongo ids.
  let randomState = 0xD0BA1;
  Math.random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };

  await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 20, serverSelectionTimeoutMS: 8000 });
  console.log('MongoDB connected:', mongoose.connection.host);

  const counters = {
    users: 0,
    leads: 0,
    properties: 0,
    campaigns: 0,
    activities: 0,
    scrapers: 0,
    webhooks: 0,
  };

  try {
    // Clear previous demo data
    await Promise.all([
      User.deleteMany({ email: { $in: [
        'admin@dubairealestate.com', 'manager@dubairealestate.com',
        'ahmed@dubairealestate.com', 'omar@dubairealestate.com',
        'fatima@dubairealestate.com', 'khalid@dubairealestate.com',
        'noor@dubairealestate.com', 'mohammed@dubairealestate.com',
      ] } }),
      Lead.deleteMany({}),
      Property.deleteMany({}),
      Campaign.deleteMany({}),
      Activity.deleteMany({}),
      Scraper.deleteMany({}),
      WebhookSubscriptionModel.deleteMany({}),
      WebhookDeliveryModel.deleteMany({}),
    ]);
    console.log('Cleared previous demo data.');

    // Hash the demo password once for all users
    const demoPasswordHash = await bcrypt.hash('Demo@123456', 10);

    // Create users (hash the demo password for every account)
    const admin = await User.create({ ...fakeUser({
      email: 'admin@dubairealestate.com',
      firstName: 'Admin',
      lastName: 'Dashboard',
      role: 'admin',
      title: 'System Administrator',
      department: 'Operations',
      permissions: ['users:read', 'users:write', 'leads:read', 'leads:write', 'properties:read', 'properties:write', 'campaigns:read', 'campaigns:write', 'scrapers:read', 'scrapers:write', 'webhooks:read', 'webhooks:write', 'analytics:read'],
    }), password: demoPasswordHash });
    counters.users++;

    const manager = await User.create({ ...fakeUser({
      email: 'manager@dubairealestate.com',
      firstName: 'Sara',
      lastName: 'Al Maktoum',
      role: 'manager',
      title: 'Sales Manager',
      department: 'Sales',
      team: 'Dubai Marina Team',
      permissions: ['leads:read', 'leads:write', 'properties:read', 'campaigns:read', 'campaigns:write', 'agents:read'],
    }), password: demoPasswordHash });
    counters.users++;

    const agents = await Promise.all([
      User.create({ ...fakeUser({ email: 'ahmed@dubairealestate.com', firstName: 'Ahmed', lastName: 'Al Mansoori', role: 'agent', team: 'Dubai Marina Team' }), password: demoPasswordHash }),
      User.create({ ...fakeUser({ email: 'omar@dubairealestate.com', firstName: 'Omar', lastName: 'Al Falasi', role: 'agent', team: 'Downtown Team' }), password: demoPasswordHash }),
      User.create({ ...fakeUser({ email: 'fatima@dubairealestate.com', firstName: 'Fatima', lastName: 'Al Rostamani', role: 'agent', team: 'Palm Team' }), password: demoPasswordHash }),
      User.create({ ...fakeUser({ email: 'khalid@dubairealestate.com', firstName: 'Khalid', lastName: 'Hassani', role: 'agent', team: 'Business Bay Team' }), password: demoPasswordHash }),
      User.create({ ...fakeUser({ email: 'noor@dubairealestate.com', firstName: 'Noor', lastName: 'Karim', role: 'agent', team: 'Dubai Marina Team' }), password: demoPasswordHash }),
      User.create({ ...fakeUser({ email: 'mohammed@dubairealestate.com', firstName: 'Mohammed', lastName: 'Nassar', role: 'agent', team: 'Downtown Team' }), password: demoPasswordHash }),
    ]);
    counters.users += agents.length;
    const allAgents = [manager, ...agents];
    console.log('Created users:', counters.users);

    // Create leads
    const createdLeads: Lead[] = [];
    const leadBatchSize = 60;
    for (let i = 0; i < leadBatchSize; i++) {
      const leadPayload = fakeLead();
      const lead = new Lead(leadPayload);
      const scoreResult = calculateLeadScore(lead as never, defaultScoringProfile);
      lead.score = scoreResult.score;
      lead.quality = classifyQuality(scoreResult.score, defaultScoringProfile.thresholds);
      lead.intent = classifyIntent(lead as never);
      lead.urgency = calculateUrgency((leadPayload as { timeline: string }).timeline as never);
      lead.probability = calculateProbability(scoreResult.score);

      // Assign some leads to agents
      if (i % 3 === 0 && allAgents.length > 0) {
        lead.assignedTo = allAgents[i % allAgents.length]._id;
      }

      // Set statuses in a realistic funnel
      if (i < 10) lead.status = 'new';
      else if (i < 20) lead.status = 'contacted';
      else if (i < 28) lead.status = 'qualified';
      else if (i < 34) lead.status = 'meeting_scheduled';
      else if (i < 38) lead.status = 'viewing_done';
      else if (i < 41) lead.status = 'negotiating';
      else if (i < 43) lead.status = 'deal_closed';
      else if (i < 45) lead.status = 'lost';
      else lead.status = 'nurturing';

      if (lead.status === 'deal_closed' || lead.status === 'qualified') lead.isQualified = true;
      if (i % 7 === 0) lead.isDuplicate = true;

      await lead.save();
      createdLeads.push(lead);
      counters.leads++;
    }
    console.log('Created leads:', counters.leads);

    // Create activities for the leads
    for (const lead of createdLeads.slice(0, 45)) {
      const numActivities = randomInt(1, 5);
      for (let a = 0; a < numActivities; a++) {
        const agent = randomChoice(allAgents);
        const activity = await Activity.create(fakeActivity(lead._id, agent._id));
        counters.activities++;
        if (activity.performedBy) {
          const user = await User.findById(activity.performedBy);
          if (user) {
            user.metrics.activitiesLogged = (user.metrics.activitiesLogged ?? 0) + 1;
            await user.save();
          }
        }
      }
    }
    console.log('Created activities:', counters.activities);

    // Update agent metrics based on assigned leads
    for (const agent of allAgents) {
      const assigned = createdLeads.filter((l) => l.assignedTo?.toString() === agent._id.toString());
      const contacted = assigned.filter((l) => ['contacted', 'qualified', 'meeting_scheduled', 'viewing_done', 'negotiating', 'deal_closed', 'lost', 'nurturing'].includes(l.status));
      const qualified = assigned.filter((l) => l.isQualified || l.status === 'qualified');
      const converted = assigned.filter((l) => l.status === 'deal_closed');
      agent.metrics.leadsAssigned = assigned.length;
      agent.metrics.leadsContacted = contacted.length;
      agent.metrics.leadsQualified = qualified.length;
      agent.metrics.leadsConverted = converted.length;
      agent.metrics.conversionRate = assigned.length > 0 ? converted.length / assigned.length : 0;
      agent.metrics.totalRevenue = converted.reduce((sum, l) => sum + (l.budget?.max ?? 0) * 0.01, 0);
      agent.metrics.avgDealValue = converted.length > 0 ? Math.round(agent.metrics.totalRevenue / converted.length) : 0;
      await agent.save();
    }

    // Create properties
    const createdProperties: Property[] = [];
    for (let i = 0; i < 35; i++) {
      const property = await Property.create(fakeProperty());
      createdProperties.push(property);
      counters.properties++;
    }
    console.log('Created properties:', counters.properties);

    // Create campaigns
    const createdCampaigns: Campaign[] = [];
    for (let i = 0; i < 6; i++) {
      const campaign = await Campaign.create(fakeCampaign({
        createdBy: admin._id,
        updatedBy: manager._id,
      }));
      createdCampaigns.push(campaign);
      counters.campaigns++;
    }
    console.log('Created campaigns:', counters.campaigns);

    // Create scrapers
    const createdScrapers: Scraper[] = [];
    for (let i = 0; i < 4; i++) {
      const scraper = await Scraper.create(fakeScraper({
        createdBy: admin._id,
        updatedBy: manager._id,
        lastRun: {
          startedAt: new Date(Date.now() - randomInt(1, 48) * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - randomInt(0, 60) * 60 * 1000),
          duration: randomInt(1000, 60000),
          itemsFound: randomInt(10, 200),
          itemsProcessed: randomInt(5, 180),
          itemsCreated: randomInt(0, 100),
          itemsUpdated: randomInt(0, 80),
          itemsSkipped: randomInt(0, 20),
          errors: [],
          status: randomChoice(['success', 'partial', 'failed']),
        },
      }));
      createdScrapers.push(scraper);
      counters.scrapers++;
    }
    console.log('Created scrapers:', counters.scrapers);

    // Create webhooks
    const createdWebhooks: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 3; i++) {
      const wh = fakeWebhook();
      const subscription = await WebhookSubscriptionModel.create({
        url: wh.url,
        encryptedSecret: encrypt(String(wh.secret)),
        events: wh.events,
        active: false,
        createdBy: admin._id.toString(),
      });
      createdWebhooks.push({ ...wh, id: subscription._id.toString() });
      counters.webhooks++;
    }
    console.log('Created webhooks:', counters.webhooks);

    // Refresh materialized analytics
    await analyticsMaterialized.refresh('default');
    console.log('Analytics materialized.');

    // Print summary
    console.log('========================================');
    console.log(' DEMO SEED COMPLETE');
    console.log('========================================');
    console.log('Users:       ', counters.users);
    console.log('Leads:       ', counters.leads);
    console.log('Properties:  ', counters.properties);
    console.log('Campaigns:   ', counters.campaigns);
    console.log('Activities:  ', counters.activities);
    console.log('Scrapers:    ', counters.scrapers);
    console.log('Webhooks:    ', counters.webhooks);
    console.log('========================================');
    console.log('Demo accounts:');
    console.log('  Admin:    admin@dubairealestate.com / Demo@123456');
    console.log('  Manager:  manager@dubairealestate.com / Demo@123456');
    console.log('  Agents:   ahmed@dubairealestate.com, omar@dubairealestate.com,');
    console.log('            fatima@dubairealestate.com, khalid@dubairealestate.com,');
    console.log('            noor@dubairealestate.com, mohammed@dubairealestate.com');
    console.log('            (all use password: Demo@123456)');
    console.log('========================================');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

main();
