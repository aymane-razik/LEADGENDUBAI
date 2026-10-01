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

export type LeadSource =
  | 'bayut'
  | 'propertyfinder'
  | 'dubizzle'
  | 'facebook'
  | 'instagram'
  | 'landing_page'
  | 'referral'
  | 'manual';

export type LeadPurpose = 'buy' | 'rent' | 'invest' | 'sell';

export type LeadTimeline =
  | 'immediate'
  | '1-3months'
  | '3-6months'
  | '6-12months'
  | 'flexible';

export type LeadPropertyType =
  | 'apartment'
  | 'villa'
  | 'townhouse'
  | 'penthouse'
  | 'commercial'
  | 'land';

export type LeadFinancing = 'cash' | 'mortgage' | 'both';

export type LeadLanguage = 'en' | 'ar' | 'ru' | 'other';

export type Currency = 'AED' | 'USD';

export interface LeadBudget {
  min: number;
  max: number;
  currency: Currency;
}
