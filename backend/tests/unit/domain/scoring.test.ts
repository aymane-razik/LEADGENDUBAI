import {
  defaultScoringProfile,
  calculateLeadScore,
  classifyQuality,
  classifyIntent,
  calculateUrgency,
  calculateProbability,
  recomputeFromProfile,
  calculateBudgetScore,
  calculateTimelineScore,
  calculatePurposeScore,
  calculateSourceScore,
  calculateCompletenessScore,
  calculateResponseScore,
  calculateEnrichmentScore,
  calculateEngagementScore,
} from '../../../src/domain/lead/scoring';
import type { ILead } from '../../../src/models';

describe('domain scoring', () => {
  const baseLead = {
    source: 'landing_page' as const,
    budget: { min: 1_000_000, max: 5_000_000, currency: 'AED' } as const,
    timeline: 'immediate' as const,
    purpose: 'buy' as const,
    firstName: 'Ahmed',
    email: 'ahmed@example.com',
    phone: '+971501234567',
    occupation: 'Manager',
    income: 25000,
    locations: ['Dubai Marina'],
    propertyType: ['apartment'],
    responseRate: 0.8,
    touchpoints: 3,
    urgency: 10,
    enriched: true,
    enrichmentData: { linkedinProfile: 'https://linkedin.com/in/ahmed' },
  } as unknown as ILead;

  it('uses the default profile id', () => {
    expect(defaultScoringProfile.id).toBe('default');
    expect(defaultScoringProfile.version).toBe(1);
    expect(defaultScoringProfile.enabled).toBe(true);
  });

  it('calculates a full score result with factors', () => {
    const result = calculateLeadScore(baseLead);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.maxPossible).toBeGreaterThan(0);
    expect(result.appliedProfile).toBe('default');
    expect(Object.keys(result.factors)).toEqual([
      'budget',
      'timeline',
      'purpose',
      'source',
      'completeness',
      'responseRate',
      'enrichment',
      'engagement',
    ]);
  });

  it('classifies quality by thresholds', () => {
    expect(classifyQuality(90, defaultScoringProfile.thresholds)).toBe('hot');
    expect(classifyQuality(75, defaultScoringProfile.thresholds)).toBe('warm');
    expect(classifyQuality(50, defaultScoringProfile.thresholds)).toBe('cold');
    expect(classifyQuality(20, defaultScoringProfile.thresholds)).toBe('junk');
  });

  it('classifies intent from timeline + budget', () => {
    expect(classifyIntent(baseLead)).toBe('high');
    const medium = { ...baseLead, timeline: '1-3months' } as unknown as ILead;
    expect(classifyIntent(medium)).toBe('medium');
    const low = { ...baseLead, timeline: 'flexible', budget: { min: 0, max: 200_000, currency: 'AED' } } as unknown as ILead;
    expect(classifyIntent(low)).toBe('low');
  });

  it('maps urgency by timeline', () => {
    expect(calculateUrgency('immediate')).toBe(10);
    expect(calculateUrgency('1-3months')).toBe(8);
    expect(calculateUrgency('3-6months')).toBe(6);
    expect(calculateUrgency('6-12months')).toBe(4);
    expect(calculateUrgency('flexible')).toBe(3);
  });

  it('clamps probability to 0..1', () => {
    expect(calculateProbability(120)).toBe(1);
    expect(calculateProbability(-20)).toBe(0);
    expect(calculateProbability(77)).toBe(0.77);
  });

  it('recomputes all derived fields from a profile', () => {
    const result = recomputeFromProfile(baseLead);
    expect(result.profileId).toBe('default');
    expect(typeof result.score).toBe('number');
    expect(['hot', 'warm', 'cold', 'junk']).toContain(result.quality);
    expect(['high', 'medium', 'low']).toContain(result.intent);
  });

  it('budget score scales with band', () => {
    expect(calculateBudgetScore({ min: 0, max: 400_000, currency: 'AED' }, 30)).toBeGreaterThan(0);
    expect(calculateBudgetScore({ min: 0, max: 5_000_000, currency: 'AED' }, 30)).toBe(30);
  });

  it('completeness score counts filled fields', () => {
    const emptyLead = {
      firstName: '',
      email: '',
      phone: '',
      occupation: undefined,
      income: undefined,
      locations: [],
      propertyType: [],
    } as unknown as Pick<ILead, 'firstName' | 'email' | 'phone' | 'occupation' | 'income' | 'locations' | 'propertyType'>;
    const fullLead = {
      firstName: 'A',
      email: 'a@b.com',
      phone: '+971501234567',
      occupation: 'x',
      income: 1000,
      locations: ['a'],
      propertyType: ['apartment'],
    } as unknown as Pick<ILead, 'firstName' | 'email' | 'phone' | 'occupation' | 'income' | 'locations' | 'propertyType'>;
    expect(calculateCompletenessScore(emptyLead, 10)).toBe(0);
    expect(calculateCompletenessScore(fullLead, 10)).toBe(10);
  });

  it('enrichment score accounts for presence of data', () => {
    expect(calculateEnrichmentScore(false, null, 3)).toBe(0);
    expect(calculateEnrichmentScore(true, { linkedinProfile: 'x' }, 3)).toBeGreaterThan(0);
  });

  it('engagement score blends touchpoints and urgency', () => {
    const score = calculateEngagementScore(10, 10, 2);
    expect(score).toBeCloseTo(2, 5);
  });
});
