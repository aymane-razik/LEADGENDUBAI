import {
  DEFAULT_DEDUP_CONFIG,
  normalizeEmail,
  normalizePhone,
  emailsMatch,
  phonesMatch,
  levenshteinSimilarity,
  nameSimilarity,
  budgetsOverlap,
  propertyTypesOverlap,
  locationsOverlap,
  computeSimilarity,
  isDuplicateCandidate,
  prepareMerge,
} from '../../../src/domain/lead/dedup';
import type { ILead } from '../../../src/models';

describe('domain dedup', () => {
  const rawLead = (overrides: Record<string, unknown> = {}) =>
    ({
      email: 'test@example.com',
      phone: '+971501234567',
      whatsapp: '+971501234567',
      firstName: 'Ahmed',
      lastName: 'Al Mansoori',
      budget: { min: 1_000_000, max: 1_500_000, currency: 'AED' },
      propertyType: ['apartment'],
      locations: ['Dubai Marina'],
      ...overrides,
    }) as unknown as ILead;

  it('normalizes emails case-insensitively', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('normalizes UAE-style phones to +971', () => {
    expect(normalizePhone('0501234567')).toBe('+971501234567');
    expect(normalizePhone('971501234567')).toBe('+971501234567');
    expect(normalizePhone('+971501234567')).toBe('+971501234567');
  });

  it('matches emails and phones exactly after normalization', () => {
    expect(emailsMatch('a@b.com', 'A@B.com')).toBe(true);
    expect(emailsMatch('a@b.com', 'c@d.com')).toBe(false);
    expect(phonesMatch('0501234567', '971501234567')).toBe(true);
    expect(phonesMatch('0501234567', '0509876543')).toBe(false);
  });

  it('levenshtein similarity with prefix boost', () => {
    expect(levenshteinSimilarity('Ahmed', 'Ahmed')).toBe(1);
    expect(levenshteinSimilarity('Ahmed', 'Ahmmed')).toBeGreaterThan(0.7);
    expect(levenshteinSimilarity('Ahmed', 'Zuhair')).toBeLessThan(0.4);
  });

  it('name similarity considers first+last', () => {
    expect(
      nameSimilarity('Ahmed', 'Al Mansoori', 'Ahmed', 'Al Mansoori'),
    ).toBe(1);
    expect(
      nameSimilarity('Ahmed', 'Al Mansoori', 'Ahmmed', 'Al Mansoori'),
    ).toBeGreaterThan(0.8);
  });

  it('detects budget overlap', () => {
    expect(
      budgetsOverlap(
        { min: 1_000_000, max: 1_500_000, currency: 'AED' },
        { min: 1_200_000, max: 2_000_000, currency: 'AED' },
      ),
    ).toBe(true);
    expect(
      budgetsOverlap(
        { min: 500_000, max: 600_000, currency: 'AED' },
        { min: 1_000_000, max: 2_000_000, currency: 'AED' },
      ),
    ).toBe(false);
  });

  it('detects property type and location overlap', () => {
    expect(
      propertyTypesOverlap(['apartment', 'villa'], ['villa']),
    ).toBe(true);
    expect(propertyTypesOverlap(['apartment'], ['villa'])).toBe(false);

    expect(
      locationsOverlap(['Dubai Marina', 'Downtown'], ['downtown']),
    ).toBe(true);
    expect(locationsOverlap(['Dubai Marina'], ['Palm Jumeirah'])).toBe(false);
  });

  it('computeSimilarity returns score + factors + explanation', () => {
    const a = rawLead();
    const b = rawLead({ firstName: 'Ahmmed', phone: '+971509876543' });
    const result = computeSimilarity(a, b);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(Object.keys(result.factors)).toEqual([
      'email',
      'phone',
      'whatsapp',
      'nameSimilarity',
      'budgetOverlap',
      'propertyTypeOverlap',
      'locationOverlap',
    ]);
    expect(result.matchedFields.length).toBeGreaterThan(0);
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it('identical contact info yields high similarity', () => {
    const a = rawLead({ email: 'same@example.com', phone: '+971501234567' });
    const b = rawLead({ email: 'same@example.com', phone: '+971501234567', firstName: 'Fatema' });
    expect(computeSimilarity(a, b).score).toBeGreaterThan(0.7);
  });

  it('flags duplicate when above threshold', () => {
    expect(isDuplicateCandidate(0.8, DEFAULT_DEDUP_CONFIG)).toBe(true);
    expect(isDuplicateCandidate(0.5, DEFAULT_DEDUP_CONFIG)).toBe(false);
  });

  it('prepareMerge merges enrichment, tags, touchpoints, notes', () => {
    const primary = rawLead({
      tags: ['a'],
      touchpoints: 1,
      notes: 'primary note',
      enrichmentData: { linkedinProfile: 'one' },
    });
    const secondary = rawLead({
      tags: ['b'],
      touchpoints: 2,
      notes: 'secondary note',
      enrichmentData: { companyInfo: { name: 'ACME' } },
    });

    const result = prepareMerge(primary, secondary, DEFAULT_DEDUP_CONFIG, 0.9);
    expect(result.mergedFields).toContain('enrichmentData');
    expect(result.mergedFields).toContain('tags');
    expect(result.mergedFields).toContain('touchpoints');
    expect(result.mergedFields).toContain('notes');
    expect(result.auditReason.length).toBeGreaterThan(0);
    expect(result.similarity).toBe(0.9);
    expect(primary.touchpoints).toBe(3);
    expect(primary.tags).toContain('a');
    expect(primary.tags).toContain('b');
  });
});
