type JsonRecord = Record<string, any>;

const stateKey = 'dune:local-demo-state:v1';
const sessionKey = 'dune:local-demo-session:v1';
const modeKey = 'dune:local-demo-active:v1';
const now = () => new Date().toISOString();
const idAt = (index: number) => `65a0000000000000000000${String(index).padStart(2, '0')}`;
const propertyPhotos = [
  'photo-1600607687939-ce8a6c25118c',
  'photo-1600210492486-724fe5c67fb0',
  'photo-1600566753086-00f18fb6b3ea',
  'photo-1600607687920-4e2a09cf159d',
  'photo-1600566753190-17f0baa2a6c3',
  'photo-1600047509807-ba8f99d2cdde',
  'photo-1600607687644-c7171b42498f',
  'photo-1560448204-e02f11c3d0e2',
].map((photo) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1400&q=85`);
const propertyGallery = (index: number) => Array.from({ length: 3 }, (_, photoIndex) => propertyPhotos[(index + photoIndex) % propertyPhotos.length]);
export const demoPropertyImage = (id: string, imageIndex = 0) => {
  const stableHash = [...id].reduce((total, character) => total + character.charCodeAt(0), imageIndex);
  return propertyPhotos[stableHash % propertyPhotos.length];
};
const read = (): JsonRecord => {
  if (typeof window === 'undefined') throw new Error('Local demo data is only available in a browser.');
  const existing = window.localStorage.getItem(stateKey);
  if (existing) {
    window.localStorage.setItem(modeKey, 'true');
    window.dispatchEvent(new Event('dune:local-demo-changed'));
    const state = JSON.parse(existing) as JsonRecord;
    if (Array.isArray(state.properties)) {
      let updated = false;
      state.properties.forEach((property: JsonRecord, index: number) => {
        if (!Array.isArray(property.images) || property.images.length === 0) {
          property.images = propertyGallery(index);
          updated = true;
        }
      });
      if (updated) window.localStorage.setItem(stateKey, JSON.stringify(state));
    }
    return state;
  }
  const users = [
    ['admin@dubairealestate.com', 'admin', 'Nadia', 'Rahman', 'Administrator'],
    ['manager@dubairealestate.com', 'manager', 'Omar', 'Khalid', 'Sales Manager'],
    ['ahmed@dubairealestate.com', 'agent', 'Ahmed', 'Al Mansoori', 'Senior Property Advisor'],
    ['fatima@dubairealestate.com', 'agent', 'Fatima', 'Noor', 'Property Advisor'],
    ['noor@dubairealestate.com', 'agent', 'Noor', 'Hassan', 'Property Advisor'],
    ['mohammed@dubairealestate.com', 'agent', 'Mohammed', 'Salem', 'Property Advisor'],
  ].map(([email, role, firstName, lastName, title], index) => ({
    id: idAt(index + 1), userId: idAt(index + 1), email, role, firstName, lastName, title,
    department: 'Residential Sales', team: 'Dubai Realty Group', phone: `+9715000000${String(index + 1).padStart(2, '0')}`,
    isActive: true, isVerified: true, isOnline: index < 4, createdAt: now(), updatedAt: now(),
    permissions: [], settings: { notifications: { email: true, sms: false, push: true, leadAssignment: true, dailyDigest: true }, preferences: { language: 'en', timezone: 'Asia/Dubai', dateFormat: 'YYYY-MM-DD', theme: 'dark' } },
  }));
  const areas = ['Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Palm Jumeirah', 'Jumeirah Village Circle', 'Arabian Ranches', 'Dubai Hills Estate', 'Bluewaters Island'];
  const statuses = ['new', 'contacted', 'qualified', 'meeting_scheduled', 'viewing_done', 'negotiating', 'nurturing', 'deal_closed'] as const;
  const firstNames = ['Layla', 'Zain', 'Mariam', 'Rashid', 'Amira', 'Yusuf', 'Hana', 'Khalid', 'Sara', 'Tariq', 'Noor', 'Adam'];
  const lastNames = ['Al Farsi', 'Haddad', 'Mansour', 'Khan', 'Rahman', 'Nasser', 'Farouk', 'Saleh', 'Malik', 'Othman'];
  const leads = Array.from({ length: 60 }, (_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const area = areas[index % areas.length];
    const status = statuses[index % statuses.length];
    const assignee = index % 4 === 0 ? undefined : users[2 + (index % 4)].id;
    return {
      id: idAt(index + 101), source: (['propertyfinder', 'bayut', 'referral', 'instagram', 'landing_page'] as const)[index % 5],
      firstName, lastName, email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replaceAll(' ', '.')}+${index + 1}@example.com`,
      phone: `+9715${String(10000000 + index).slice(0, 8)}`, whatsapp: `+9715${String(10000000 + index).slice(0, 8)}`,
      language: 'en', propertyType: [index % 3 === 0 ? 'villa' : 'apartment'], purpose: index % 4 === 0 ? 'rent' : 'buy',
      budget: { min: 900000 + index * 12000, max: 1600000 + index * 21000, currency: 'AED' }, locations: [area],
      timeline: (['immediate', '1-3months', '3-6months', 'flexible'] as const)[index % 4], score: 42 + ((index * 7) % 57),
      quality: (['hot', 'warm', 'cold'] as const)[index % 3], intent: (['high', 'medium', 'low'] as const)[index % 3],
      urgency: 30 + (index % 70), probability: 0.25 + ((index % 60) / 100), status, substatus: '', assignedTo: assignee,
      assignedToName: assignee ? `${users.find((u) => u.id === assignee)?.firstName} ${users.find((u) => u.id === assignee)?.lastName}` : undefined,
      lastContact: now(), nextFollowup: new Date(Date.now() + (index + 1) * 86400000).toISOString(), touchpoints: index % 8,
      responseRate: 0.2 + ((index % 7) / 10), enriched: index % 2 === 0, tags: index % 3 === 0 ? ['priority', 'dubai'] : ['dubai'],
      isDuplicate: false, isActive: true, isQualified: status === 'qualified', isBlacklisted: false, doNotContact: false,
      capturedAt: now(), createdAt: new Date(Date.now() - index * 3600000).toISOString(), updatedAt: now(), notes: `Interested in ${area} properties.`,
      nationality: 'UAE', occupation: 'Business owner', company: 'Private', income: 45000 + index * 1000, bedrooms: 2,
      financing: 'both', enrichmentData: {},
    };
  });
  const properties = Array.from({ length: 35 }, (_, index) => {
    const area = areas[index % areas.length]; const price = 1250000 + index * 187500; const size = 760 + (index % 9) * 125;
    return {
      id: idAt(index + 201), source: (['bayut', 'propertyfinder', 'dubizzle'] as const)[index % 3], sourceId: `DUB-${index + 2001}`,
      url: `https://example.invalid/listings/${index + 1}`, title: `${index % 2 ? 'Light-filled' : 'Waterfront'} ${index % 3 ? 'residence' : 'apartment'} in ${area}`,
      description: `A considered home with generous natural light, thoughtful finishes, and an easy connection to the neighborhood. Located in ${area}.`,
      type: index % 6 === 0 ? 'villa' : 'apartment', purpose: index % 4 === 0 ? 'rent' : 'sale', bedrooms: 1 + (index % 4), bathrooms: 1 + (index % 3),
      size, price, pricePerSqft: Math.round(price / size), currency: 'AED', location: { area, subArea: 'Dubai', city: 'Dubai', country: 'UAE', coordinates: { type: 'Point', coordinates: [55.14 + (index % 8) * 0.04, 25.06 + (index % 6) * 0.03] } },
      amenities: ['Pool', 'Gym', 'Concierge', 'Parking'], furnishing: index % 2 ? 'furnished' : 'unfurnished', parking: 1, images: propertyGallery(index), videos: [], agentName: users[2 + (index % 4)].firstName + ' ' + users[2 + (index % 4)].lastName,
      agentPhone: users[2 + (index % 4)].phone, agentEmail: users[2 + (index % 4)].email, agency: 'Dubai Realty Group', isOwner: false, permitNumber: `DLD-${index + 4000}`,
      views: 240 + index * 23, inquiries: 12 + (index % 21), favorites: 3 + (index % 9), listedDate: now(), lastUpdated: now(), priceHistory: [], marketTrend: 'increasing',
      daysOnMarket: 4 + index * 2, competitorCount: 18 + index, avgAreaPrice: price * 0.96, priceComparison: 4, isActive: true, isFeatured: index < 4,
      isVerified: true, isPremium: index < 8, scrapedAt: now(), lastScrapedAt: now(), completionStatus: 'ready',
    };
  });
  const campaigns = [
    ['Marina intent — early spring', 'email', 'active'], ['A quieter kind of upgrade', 'whatsapp', 'draft'], ['Open doors, no pressure', 'multi_channel', 'paused'],
    ['The Palm, considered', 'email', 'completed'], ['A better first address', 'sms', 'draft'], ['New homes, familiar pace', 'multi_channel', 'active'],
  ].map(([name, type, status], index) => ({
    id: idAt(index + 301), name, description: `A thoughtful ${type} sequence for high-intent Dubai buyers.`, type, status,
    targeting: { filters: { purpose: 'buy', locations: [areas[index % areas.length]] }, maxRecipients: 30, includeLeadIds: [], excludeLeadIds: [] },
    content: { subject: `A home worth a second look · ${areas[index % areas.length]}`, body: 'Hello {{firstName}}, we found a few homes that feel aligned with what you are looking for. Want a short, no-pressure tour?', template: 'standard', variables: { firstName: '{{lead.firstName}}' }, attachments: [] },
    schedule: { type: index % 2 ? 'drip' : 'immediate', startDate: now(), timezone: 'Asia/Dubai', sequences: [] },
    metrics: { targetCount: 30, sent: 18 + index * 7, delivered: 16 + index * 6, failed: 1, opened: 9 + index * 3, clicked: 4 + index, replied: 2 + index, unsubscribed: 0, converted: index, revenue: index * 925000 },
    settings: { trackOpens: true, trackClicks: true, allowUnsubscribe: true, replyToEmail: 'hello@dubairealty.demo', senderId: 'Dune · Dubai Realty' },
    createdBy: users[0].id, updatedBy: users[0].id, createdAt: now(), updatedAt: now(),
  }));
  const scrapers = ['Bayut · residential pulse', 'Property Finder · prime homes', 'Dubizzle · new listings', 'Dubai market signals'].map((name, index) => ({
    id: idAt(index + 401), name, source: (['bayut', 'propertyfinder', 'dubizzle', 'custom'] as const)[index], type: index === 3 ? 'market_data' : 'property',
    config: { url: `https://example.invalid/sources/${index + 1}`, method: 'GET' }, schedule: '0 */4 * * *', timezone: 'Asia/Dubai', enabled: true, status: 'idle',
    lastRun: { startedAt: now(), completedAt: now(), duration: 840, itemsFound: 24 + index * 3, itemsProcessed: 24 + index * 3, itemsCreated: 3, itemsUpdated: 15, itemsSkipped: 6, errors: [], status: 'success' },
    metrics: { totalRuns: 18 + index, successfulRuns: 17 + index, failedRuns: 1, totalItems: 470 + index * 82, avgDuration: 920, avgItemsPerRun: 27, successRate: 0.96, lastSuccessAt: now() },
    settings: { retryAttempts: 3, retryDelay: 60, timeout: 30000, concurrency: 2, respectRobotsTxt: true }, notifications: { onSuccess: true, onError: true, emailTo: [] },
    createdBy: users[0].id, isActive: true, createdAt: now(), updatedAt: now(),
  }));
  const webhooks = ['https://studio.example.invalid/events', 'https://ops.example.invalid/lead-signals', 'https://demo.example.invalid/activity'].map((url, index) => ({
    id: idAt(index + 501), tenantId: 'demo-local', url, events: ['lead.created', 'lead.updated'], active: false, createdAt: now(),
  }));
  const state = { users, leads, properties, campaigns, scrapers, webhooks, activities: [] as JsonRecord[], deliveryHistory: [] as JsonRecord[] };
  window.localStorage.setItem(stateKey, JSON.stringify(state));
  window.localStorage.setItem(modeKey, 'true');
  window.dispatchEvent(new Event('dune:local-demo-changed'));
  return state;
};

const persist = (state: JsonRecord) => window.localStorage.setItem(stateKey, JSON.stringify(state));
const envelope = <T,>(message: string, data: T) => ({ success: true, message, data });
const notFound = () => envelope('Record not found', null);
const csvEsc = (value: unknown) => String(value ?? '').replace(/[\r\n,]/g, ' ').trim();

export const localDemoIsActive = () => typeof window !== 'undefined' && window.localStorage.getItem(modeKey) === 'true';

export function resetLocalDemo() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(stateKey);
  window.localStorage.removeItem(sessionKey);
  window.localStorage.removeItem('dune:local-demo-password:v1');
  window.localStorage.removeItem('dune:saved-properties');
  window.localStorage.setItem(modeKey, 'true');
  window.dispatchEvent(new Event('dune:local-demo-changed'));
}

export function shouldUseLocalDemo(error: unknown, method?: string, path?: string, body?: unknown) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' || typeof window === 'undefined') return false;
  const response = (error as { response?: { status?: number } } | null)?.response;
  if (!response || (response.status ?? 0) >= 500) return true;

  // A demo API may be healthy while its database has no seeded account. Only
  // the known demo login can fall back on 401; all other auth failures remain
  // visible so this cannot mask invalid credentials for regular users.
  if (response.status === 401 && method?.toUpperCase() === 'POST' && /\/auth\/login\/?$/.test(path ?? '')) {
    const input = (body && typeof body === 'object' ? body : {}) as JsonRecord;
    const expectedPassword = window.localStorage.getItem('dune:local-demo-password:v1') ?? 'Demo@123456';
    return String(input.email ?? '').toLowerCase() === 'admin@dubairealestate.com' && input.password === expectedPassword;
  }
  // Demo mode is a complete browser-local workspace, so API contract gaps,
  // missing routes, and throttling should not block its simulated workflows.
  if ([400, 404, 405, 422, 429].includes(response.status ?? 0)) return true;
  return false;
}

export function runLocalDemo(method: string, endpoint: string, body?: unknown, query?: Record<string, unknown>): unknown {
  const state = read();
  const verb = method.toUpperCase();
  const pathOnly = endpoint.split('?')[0].replace(/^\/api\/v\d+/, '').replace(/\/$/, '') || '/';
  const params = { ...Object.fromEntries(new URLSearchParams(endpoint.split('?')[1] ?? '')), ...query } as Record<string, unknown>;
  const input = (body && typeof body === 'object' ? body : {}) as JsonRecord;
  const userSession = JSON.parse(window.localStorage.getItem(sessionKey) ?? 'null') as JsonRecord | null;
  const byId = (items: JsonRecord[], id: string) => items.find((item) => item.id === id || item._id === id);
  const collection = (items: JsonRecord[], name: string) => {
    let filtered = items;
    if (params.search) { const term = String(params.search).toLowerCase(); filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(term)); }
    for (const key of ['status', 'type', 'source', 'purpose', 'quality', 'intent', 'timeline'] as const) if (params[key]) filtered = filtered.filter((item) => item[key] === params[key]);
    if (params.role) filtered = filtered.filter((item) => item.role === params.role);
    if (name === 'Properties') {
      if (params.minPrice) filtered = filtered.filter((item) => Number(item.price) >= Number(params.minPrice));
      if (params.maxPrice) filtered = filtered.filter((item) => Number(item.price) <= Number(params.maxPrice));
    }
    if (params.sort) { const key = String(params.sort).replace(/^-/, ''); const direction = String(params.sort).startsWith('-') ? -1 : 1; filtered = [...filtered].sort((a, b) => direction * String(a[key] ?? '').localeCompare(String(b[key] ?? ''))); }
    const page = Math.max(1, Number(params.page ?? 1)); const limit = Math.max(1, Math.min(100, Number(params.limit ?? (filtered.length || 20))));
    return envelope(`${name} fetched`, { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit });
  };
  const save = (message: string, data: unknown) => { persist(state); return envelope(message, data); };

  if (pathOnly === '/auth/login' && verb === 'POST') {
    const found = state.users.find((user: JsonRecord) => user.email.toLowerCase() === String(input.email ?? '').toLowerCase());
    const validPassword = window.localStorage.getItem('dune:local-demo-password:v1') ?? 'Demo@123456';
    if (!found || input.password !== validPassword) throw new Error('Use a seeded demo account and the current local demo password.');
    const { password: _password, ...user } = found;
    window.localStorage.setItem(sessionKey, JSON.stringify(user));
    return envelope('Local demo session started; changes are saved in this browser.', { user });
  }
  if (pathOnly === '/auth/me' && verb === 'GET') return envelope('Local demo profile', userSession);
  if (pathOnly === '/auth/logout' && verb === 'POST') { window.localStorage.removeItem(sessionKey); return envelope('Signed out', null); }
  if (pathOnly === '/auth/me' && verb === 'PUT' && userSession) {
    Object.assign(userSession, input);
    if (input.settings) userSession.settings = { ...userSession.settings, ...input.settings };
    window.localStorage.setItem(sessionKey, JSON.stringify(userSession));
    return envelope('Profile saved in this browser', { ...userSession });
  }
  if (pathOnly === '/auth/change-password' && ['PUT', 'POST'].includes(verb)) {
    const validPassword = window.localStorage.getItem('dune:local-demo-password:v1') ?? 'Demo@123456';
    if (input.currentPassword !== validPassword) throw new Error('Current password does not match the local demo account.');
    if (typeof input.newPassword !== 'string' || input.newPassword.length < 8) throw new Error('New password must contain at least 8 characters.');
    window.localStorage.setItem('dune:local-demo-password:v1', input.newPassword);
    return envelope('Password updated for the local demo account', { simulated: true });
  }
  if (/^\/auth\/verify-email$/.test(pathOnly)) return envelope('Updated in local demo mode', { simulated: true });

  if (pathOnly === '/analytics/dashboard') {
    const byStatus = Object.fromEntries([...new Set(state.leads.map((lead: JsonRecord) => lead.status))].map((status) => [status, state.leads.filter((lead: JsonRecord) => lead.status === status).length]));
    const byQuality = Object.fromEntries(['hot', 'warm', 'cold', 'junk'].map((quality) => [quality, state.leads.filter((lead: JsonRecord) => lead.quality === quality).length]));
    const active = state.leads.filter((lead: JsonRecord) => lead.isActive).length;
    const bySource = Object.fromEntries([...new Set(state.leads.map((lead: JsonRecord) => lead.source))].map((source) => [source, state.leads.filter((lead: JsonRecord) => lead.source === source).length]));
    const byPropertyType = Object.fromEntries([...new Set(state.properties.map((property: JsonRecord) => property.type))].map((type) => [type, state.properties.filter((property: JsonRecord) => property.type === type).length]));
    const byPropertyPurpose = Object.fromEntries([...new Set(state.properties.map((property: JsonRecord) => property.purpose))].map((purpose) => [purpose, state.properties.filter((property: JsonRecord) => property.purpose === purpose).length]));
    const byArea = Object.fromEntries([...new Set(state.properties.map((property: JsonRecord) => property.location.area))].map((area) => [area, state.properties.filter((property: JsonRecord) => property.location.area === area).length]));
    return envelope('Local demo analytics', { leads: { total: state.leads.length, active, hot: byQuality.hot ?? 0, qualified: byStatus.qualified ?? 0, converted: byStatus.deal_closed ?? 0, byQuality, byStatus, bySource, byAssignment: {} }, properties: { total: state.properties.length, active: state.properties.length, featured: state.properties.filter((p: JsonRecord) => p.isFeatured).length, byType: byPropertyType, byPurpose: byPropertyPurpose, byArea, totalListingsValue: state.properties.reduce((total: number, property: JsonRecord) => total + Number(property.price), 0) }, campaigns: { total: state.campaigns.length, active: state.campaigns.filter((c: JsonRecord) => c.status === 'active').length, byType: {}, byStatus: {}, totalSent: 0, totalDelivered: 0, totalOpen: 0, totalClicked: 0, totalConverted: 0, totalRevenue: 0 } });
  }
  if (pathOnly === '/leads' && verb === 'GET') return collection(state.leads, 'Leads');
  if (pathOnly === '/leads/export' && verb === 'GET') return envelope('Lead export ready', state.leads);
  const leadRoute = pathOnly.match(/^\/leads\/([^/]+)(?:\/(.*))?$/);
  if (leadRoute) {
    const [, id, action = ''] = leadRoute; const lead = byId(state.leads, id);
    if (!lead) return notFound();
    if (action === 'score/explain' && verb === 'GET') return envelope('Score factors loaded', { id, score: lead.score, maxPossible: 100, profile: 'local-demo-v1', factors: { budget: 18, timeline: 17, purpose: 12, source: 10, completeness: 14, responseRate: 8, enrichment: 9, engagement: 12 } });
    if (action === 'duplicates' && verb === 'GET') return envelope('Duplicate review complete', []);
    if (action === 'activities' && verb === 'GET') return envelope('Lead activity loaded', state.activities.filter((a: JsonRecord) => a.leadId === id));
    if (action === 'activities' && verb === 'POST') { const activity = { ...input, id: idAt(900 + state.activities.length), leadId: id, performedBy: userSession?.userId ?? userSession?.id ?? idAt(1), isCompleted: false, createdAt: now(), updatedAt: now() }; state.activities.unshift(activity); return save('Activity saved locally', activity); }
    if (action === 'status' && verb === 'PATCH') { lead.status = input.status; lead.isQualified = input.status === 'qualified'; lead.updatedAt = now(); return save('Lead status updated locally', lead); }
    if (action === 'assign' && verb === 'PATCH') {
      const agent = state.users.find((u: JsonRecord) => u.id === input.userId && u.role === 'agent');
      if (!agent || !/^[a-f\d]{24}$/i.test(String(input.userId))) throw new Error('Choose an active seeded agent.');
      lead.assignedTo = agent.id; lead.assignedToName = `${agent.firstName} ${agent.lastName}`; lead.updatedAt = now();
      return save(`Lead assigned to ${lead.assignedToName}`, lead);
    }
    if (action === 'auto-assign' && verb === 'PATCH') { const agent = state.users.filter((u: JsonRecord) => u.role === 'agent')[state.leads.filter((l: JsonRecord) => l.assignedTo).length % 4]; lead.assignedTo = agent.id; lead.assignedToName = `${agent.firstName} ${agent.lastName}`; return save('Lead auto-assigned locally', lead); }
    if (!action && verb === 'GET') return envelope('Lead loaded', lead);
    if (!action && verb === 'PUT') { Object.assign(lead, input, { updatedAt: now() }); return save('Lead updated locally', lead); }
    if (!action && verb === 'DELETE') { state.leads = state.leads.filter((item: JsonRecord) => item.id !== id); return save('Lead removed locally', null); }
  }
  if (pathOnly === '/leads' && verb === 'POST') {
    const id = idAt(900 + state.leads.length); const lead = { ...input, id, score: 55, quality: 'warm', intent: 'medium', urgency: 50, probability: 0.5, status: 'new', touchpoints: 0, responseRate: 0, enriched: false, tags: [], isDuplicate: false, isActive: true, isQualified: false, isBlacklisted: false, doNotContact: false, capturedAt: now(), createdAt: now(), updatedAt: now(), notes: input.notes ?? '' };
    state.leads.unshift(lead); return save('Lead created in local demo', lead);
  }

  if (pathOnly === '/properties' && verb === 'GET') return collection(state.properties, 'Properties');
  const propertyRoute = pathOnly.match(/^\/properties\/([^/]+)$/);
  if (propertyRoute) { const property = byId(state.properties, propertyRoute[1]); if (!property) return notFound(); if (verb === 'GET') return envelope('Property loaded', property); if (verb === 'PUT') { Object.assign(property, input, { lastUpdated: now() }); return save('Property updated locally', property); } }
  if (pathOnly === '/activities' && verb === 'POST') { const activity = { ...input, id: idAt(900 + state.activities.length), performedBy: userSession?.userId ?? idAt(1), isCompleted: false, createdAt: now(), updatedAt: now() }; state.activities.unshift(activity); return save('Activity saved in this browser', activity); }

  if (pathOnly === '/campaigns' && verb === 'GET') return collection(state.campaigns, 'Campaigns');
  if (pathOnly === '/campaigns' && verb === 'POST') { const campaign = { ...input, id: idAt(800 + state.campaigns.length), metrics: { targetCount: 0, sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, replied: 0, unsubscribed: 0, converted: 0, revenue: 0 }, createdBy: userSession?.userId ?? idAt(1), createdAt: now(), updatedAt: now() }; state.campaigns.unshift(campaign); return save('Campaign saved in local demo', campaign); }
  const campaignRoute = pathOnly.match(/^\/campaigns\/([^/]+)(?:\/(.*))?$/);
  if (campaignRoute) { const [, id, action = ''] = campaignRoute; const campaign = byId(state.campaigns, id); if (!campaign) return notFound();
    if (!action && verb === 'GET') return envelope('Campaign loaded', campaign);
    if (action === 'recipients' && verb === 'GET') { const recipients = state.leads.filter((lead: JsonRecord) => lead.isActive && !['lost', 'deal_closed'].includes(lead.status)).slice(0, campaign.targeting?.maxRecipients ?? 25).map((lead: JsonRecord) => ({ ...lead, _id: lead.id })); return envelope('Demo recipients preview', { targeting: campaign.targeting, recipients, total: recipients.length, simulated: true }); }
    if (action === 'drip-schedule' && verb === 'GET') return envelope('Schedule loaded', { steps: [] });
    if (action === 'analytics' && verb === 'GET') return envelope('Campaign metrics loaded', campaign.metrics);
    if (['start', 'resume', 'pause'].includes(action) && verb === 'POST') { campaign.status = action === 'pause' ? 'paused' : 'active'; campaign.updatedAt = now(); return save(`Campaign ${action} simulated locally. No message was sent.`, { campaignId: id, status: campaign.status, simulated: true, noMessagesSent: true }); }
    if (action === 'test' && verb === 'POST') return envelope('Campaign test simulated locally. No message was sent.', { campaignId: id, simulated: true, noMessagesSent: true });
    if (!action && verb === 'PUT') { Object.assign(campaign, input, { updatedAt: now() }); return save('Campaign updated locally', campaign); }
  }

  if (pathOnly === '/users' && verb === 'GET') return collection(state.users, 'Team members');
  if (pathOnly === '/users/agents' && verb === 'GET') return envelope('Agents loaded', state.users.filter((user: JsonRecord) => user.role === 'agent' && user.isActive));
  if (pathOnly === '/users' && verb === 'POST') { const { password: _password, ...profile } = input; const user = { ...profile, id: idAt(700 + state.users.length), userId: idAt(700 + state.users.length), isActive: true, isOnline: false, createdAt: now(), updatedAt: now() }; state.users.push(user); return save('Team member added locally', user); }
  const userRoute = pathOnly.match(/^\/users\/([^/]+)(?:\/(.*))?$/);
  if (userRoute) { const [, id, action = ''] = userRoute; const user = byId(state.users, id); if (!user) return notFound(); if (action === 'metrics' && verb === 'GET') { const assigned = state.leads.filter((lead: JsonRecord) => lead.assignedTo === id); return envelope('Agent metrics loaded', { leadsAssigned: assigned.length, leadsContacted: assigned.filter((lead: JsonRecord) => lead.status === 'contacted').length, leadsQualified: assigned.filter((lead: JsonRecord) => lead.status === 'qualified').length, leadsConverted: assigned.filter((lead: JsonRecord) => lead.status === 'deal_closed').length, conversionRate: assigned.length ? assigned.filter((lead: JsonRecord) => lead.status === 'deal_closed').length / assigned.length : 0, avgResponseTime: 18, avgDealValue: 1200000, totalRevenue: 0, activitiesLogged: state.activities.filter((a: JsonRecord) => a.performedBy === id).length }); } if (verb === 'GET') return envelope('Team member loaded', user); }

  if (pathOnly === '/scrapers' && verb === 'GET') return envelope('Data streams loaded', state.scrapers);
  const scraperRoute = pathOnly.match(/^\/scrapers\/([^/]+)(?:\/(.*))?$/);
  if (scraperRoute) { const [, id, action = ''] = scraperRoute; const scraper = byId(state.scrapers, id); if (!scraper) return notFound(); if (!action && verb === 'GET') return envelope('Data stream loaded', scraper); if (!action && verb === 'PUT') { Object.assign(scraper, input, { updatedAt: now() }); if (input.url) scraper.config.url = input.url; return save('Data stream saved locally', scraper); } if (action === 'run' && verb === 'POST') { scraper.lastRun = { startedAt: now(), completedAt: now(), duration: 900, itemsFound: 18, itemsProcessed: 18, itemsCreated: 3, itemsUpdated: 12, itemsSkipped: 3, errors: [], status: 'success' }; scraper.metrics.totalRuns++; scraper.metrics.successfulRuns++; return save('Demo run completed locally. No site was contacted and no listings were imported.', { scraperId: id, simulated: true, noExternalRequests: true }); } }

  if (pathOnly === '/webhooks' && verb === 'GET') return envelope('Connections loaded', state.webhooks);
  if (pathOnly === '/webhooks' && verb === 'POST') { const webhook = { ...input, id: idAt(600 + state.webhooks.length), active: false, tenantId: 'demo-local', createdAt: now() }; state.webhooks.push(webhook); return save('Demo connection saved locally and kept inactive', webhook); }
  const webhookRoute = pathOnly.match(/^\/webhooks\/([^/]+)(?:\/(.*))?$/);
  if (webhookRoute) { const [, id, action = ''] = webhookRoute; const webhook = byId(state.webhooks, id); if (!webhook) return notFound(); if (action === 'test' && verb === 'POST') { const delivery = { id: idAt(650 + state.deliveryHistory.length), subscriptionId: id, eventType: 'webhook.test', attempt: 1, status: 'delivered', responseStatus: 200, errorMessage: 'Simulated locally. No network request was made.', createdAt: now(), deliveredAt: now(), simulated: true }; state.deliveryHistory.unshift(delivery); return save('Webhook test simulated locally. No outbound request was made.', delivery); } if (action === 'deliveries' && verb === 'GET') return envelope('Delivery history loaded', state.deliveryHistory.filter((item: JsonRecord) => item.subscriptionId === id)); if (verb === 'DELETE') { state.webhooks = state.webhooks.filter((item: JsonRecord) => item.id !== id); return save('Connection removed locally', null); } if (!action && verb === 'PUT') { Object.assign(webhook, input); return save('Connection updated locally', webhook); } }

  return envelope('Local demo action recorded', { simulated: true, method: verb, path: pathOnly });
}
