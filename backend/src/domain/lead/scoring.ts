import type { ILead } from '../../models';
import type { LeadBudget, LeadTimeline, LeadPurpose, LeadSource } from './types';

export interface ScoringProfile {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly weights: ScoringWeights;
  readonly thresholds: ScoreThresholds;
  readonly decay?: ScoreDecay;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ScoringWeights {
  readonly budget: number;
  readonly timeline: number;
  readonly purpose: number;
  readonly source: number;
  readonly completeness: number;
  readonly responseRate: number;
  readonly enrichment: number;
  readonly engagement: number;
}

export interface ScoreThresholds {
  readonly hot: number;
  readonly warm: number;
  readonly cold: number;
}

export interface ScoreDecay {
  readonly enabled: boolean;
  readonly halfLifeDays: number;
  readonly field: 'lastContact' | 'capturedAt' | 'nextFollowup';
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

export interface ScoreResult {
  readonly score: number;
  readonly factors: ScoreFactors;
  readonly maxPossible: number;
  readonly appliedProfile: string;
}

const DEFAULT_PROFILE: ScoringProfile = {
  id: 'default',
  name: 'Default Lead Scoring',
  version: 1,
  weights: {
    budget: 30,
    timeline: 20,
    purpose: 15,
    source: 15,
    completeness: 10,
    responseRate: 5,
    enrichment: 3,
    engagement: 2,
  },
  thresholds: {
    hot: 80,
    warm: 60,
    cold: 40,
  },
  decay: {
    enabled: false,
    halfLifeDays: 30,
    field: 'capturedAt',
  },
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const BUDGET_BANDS: Array<{ min: number; score: number }> = [
  { min: 5_000_000, score: 30 },
  { min: 2_000_000, score: 25 },
  { min: 1_000_000, score: 20 },
  { min: 500_000, score: 15 },
  { min: 0, score: 10 },
];

const TIMELINE_SCORES: Record<LeadTimeline, number> = {
  immediate: 20,
  '1-3months': 15,
  '3-6months': 10,
  '6-12months': 5,
  flexible: 3,
};

const PURPOSE_SCORES: Record<LeadPurpose, number> = {
  buy: 15,
  invest: 12,
  rent: 8,
  sell: 6,
};

const SOURCE_SCORES: Record<LeadSource, number> = {
  landing_page: 15,
  referral: 12,
  bayut: 10,
  propertyfinder: 10,
  facebook: 8,
  dubizzle: 7,
  instagram: 7,
  manual: 5,
};

const COMPLETENESS_FIELDS = [
  'firstName',
  'email',
  'phone',
  'occupation',
  'income',
  'locations',
  'propertyType',
] as const;

export const defaultScoringProfile = DEFAULT_PROFILE;

export const calculateBudgetScore = (budget: LeadBudget, weight: number): number => {
  const band = BUDGET_BANDS.find((b) => budget.max >= b.min) ?? BUDGET_BANDS[BUDGET_BANDS.length - 1];
  return (band.score / 30) * weight;
};

export const calculateTimelineScore = (timeline: LeadTimeline, weight: number): number =>
  (TIMELINE_SCORES[timeline] / 20) * weight;

export const calculatePurposeScore = (purpose: LeadPurpose, weight: number): number =>
  (PURPOSE_SCORES[purpose] / 15) * weight;

export const calculateSourceScore = (source: LeadSource, weight: number): number =>
  ((SOURCE_SCORES[source] ?? 5) / 15) * weight;

export const calculateCompletenessScore = (
  lead: Pick<ILead, 'firstName' | 'email' | 'phone' | 'occupation' | 'income' | 'locations' | 'propertyType'>,
  weight: number,
): number => {
  let filled = 0;
  let total = 0;
  for (const field of COMPLETENESS_FIELDS) {
    total++;
    const value = lead[field];
    if (field === 'locations' || field === 'propertyType') {
      if (Array.isArray(value) && value.length > 0) filled++;
    } else if (value != null && value !== '') {
      filled++;
    }
  }
  return (filled / total) * weight;
};

export const calculateResponseScore = (responseRate: number, weight: number): number =>
  (Math.max(0, Math.min(1, responseRate)) * weight);

export const calculateEnrichmentScore = (
  enriched: boolean,
  enrichmentData: Record<string, unknown> | null | undefined,
  weight: number,
): number => {
  let score = 0;
  if (enriched) score += 0.5 * weight;
  if (enrichmentData) {
    const keys = Object.keys(enrichmentData).filter((k) => enrichmentData[k] != null);
    score += Math.min(1, keys.length / 5) * 0.5 * weight;
  }
  return score;
};

export const calculateEngagementScore = (
  touchpoints: number,
  urgency: number,
  weight: number,
): number => {
  const touchpointRatio = Math.min(1, touchpoints / 10);
  const urgencyRatio = urgency / 10;
  return ((touchpointRatio * 0.6 + urgencyRatio * 0.4) * weight);
};

export const calculateLeadScore = (
  lead: ILead,
  profile = defaultScoringProfile,
): ScoreResult => {
  if (!profile.enabled) {
    return {
      score: 0,
      factors: {
        budget: 0,
        timeline: 0,
        purpose: 0,
        source: 0,
        completeness: 0,
        responseRate: 0,
        enrichment: 0,
        engagement: 0,
      },
      maxPossible: profile.weights.budget +
        profile.weights.timeline +
        profile.weights.purpose +
        profile.weights.source +
        profile.weights.completeness +
        profile.weights.responseRate +
        profile.weights.enrichment +
        profile.weights.engagement,
      appliedProfile: profile.id,
    };
  }

  const w = profile.weights;
  const factors: ScoreFactors = {
    budget: calculateBudgetScore(lead.budget, w.budget),
    timeline: calculateTimelineScore(lead.timeline, w.timeline),
    purpose: calculatePurposeScore(lead.purpose, w.purpose),
    source: calculateSourceScore(lead.source, w.source),
    completeness: calculateCompletenessScore(
      lead as unknown as Pick<
        ILead,
        'firstName' | 'email' | 'phone' | 'occupation' | 'income' | 'locations' | 'propertyType'
      >,
      w.completeness,
    ),
    responseRate: calculateResponseScore(lead.responseRate, w.responseRate),
    enrichment: calculateEnrichmentScore(lead.enriched, lead.enrichmentData, w.enrichment),
    engagement: calculateEngagementScore(lead.touchpoints, lead.urgency, w.engagement),
  };

  const score = Object.values(factors).reduce((sum, v) => sum + v, 0);
  const maxPossible = Object.values(factors).reduce((sum, v) => sum + v, 0);

  return {
    score: Math.min(100, Math.round(score * 100) / 100),
    factors,
    maxPossible: Math.min(100, Math.round(maxPossible * 100) / 100),
    appliedProfile: profile.id,
  };
};

export const classifyQuality = (score: number, thresholds: ScoreThresholds): 'hot' | 'warm' | 'cold' | 'junk' => {
  if (score >= thresholds.hot) return 'hot';
  if (score >= thresholds.warm) return 'warm';
  if (score >= thresholds.cold) return 'cold';
  return 'junk';
};

export const classifyIntent = (lead: ILead): 'high' | 'medium' | 'low' => {
  if (lead.timeline === 'immediate' && lead.budget.max >= 1_000_000) return 'high';
  if (lead.timeline === '1-3months' || lead.budget.max >= 500_000) return 'medium';
  return 'low';
};

export const calculateUrgency = (timeline: LeadTimeline): number => {
  switch (timeline) {
    case 'immediate':
      return 10;
    case '1-3months':
      return 8;
    case '3-6months':
      return 6;
    case '6-12months':
      return 4;
    default:
      return 3;
  }
};

export const calculateProbability = (score: number): number =>
  Math.min(1, Math.max(0, score / 100));

export const recomputeFromProfile = (
  lead: ILead,
  profile = defaultScoringProfile,
): {
  score: number;
  quality: 'hot' | 'warm' | 'cold' | 'junk';
  intent: 'high' | 'medium' | 'low';
  urgency: number;
  probability: number;
  factors: ScoreFactors;
  profileId: string;
} => {
  const result = calculateLeadScore(lead, profile);
  return {
    score: result.score,
    quality: classifyQuality(result.score, profile.thresholds),
    intent: classifyIntent(lead),
    urgency: calculateUrgency(lead.timeline),
    probability: calculateProbability(result.score),
    factors: result.factors,
    profileId: result.appliedProfile,
  };
};
