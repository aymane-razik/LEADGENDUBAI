import {
  calculateLeadScore,
  calculateProbability,
  calculateUrgency,
  classifyIntent,
  classifyQuality,
} from '../../../src/services/scoring.service';

describe('scoring.service', () => {
  const lead = {
    source: 'landing_page',
    budget: { min: 1000000, max: 5000000, currency: 'AED' },
    timeline: 'immediate',
    purpose: 'buy',
    firstName: 'John',
    email: 'john@example.com',
    phone: '+971501234567',
    occupation: 'Manager',
    income: 25000,
    locations: ['Dubai Marina'],
    propertyType: ['apartment'],
    responseRate: 0.8,
  };

  it('calculates lead score within range', () => {
    const score = calculateLeadScore(lead as never);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('classifies quality correctly', () => {
    expect(classifyQuality(85)).toBe('hot');
    expect(classifyQuality(65)).toBe('warm');
    expect(classifyQuality(45)).toBe('cold');
    expect(classifyQuality(10)).toBe('junk');
  });

  it('classifies intent correctly', () => {
    expect(classifyIntent(lead as never)).toBe('high');
  });

  it('covers low and medium intent branches', () => {
    const mediumLead = {
      ...lead,
      timeline: '1-3months',
      budget: { min: 100000, max: 600000 },
    };
    const lowLead = {
      ...lead,
      timeline: 'flexible',
      budget: { min: 10000, max: 200000 },
    };
    expect(classifyIntent(mediumLead as never)).toBe('medium');
    expect(classifyIntent(lowLead as never)).toBe('low');
  });

  it('covers urgency and probability helpers', () => {
    expect(calculateUrgency('immediate')).toBe(10);
    expect(calculateUrgency('1-3months')).toBe(8);
    expect(calculateUrgency('3-6months')).toBe(6);
    expect(calculateUrgency('6-12months')).toBe(4);
    expect(calculateUrgency('flexible')).toBe(3);
    expect(calculateProbability(120)).toBe(1);
    expect(calculateProbability(-20)).toBe(0);
    expect(calculateProbability(77)).toBe(0.77);
  });

  it('covers additional scoring branches', () => {
    const lowerBudgetLead = {
      ...lead,
      source: 'manual',
      budget: { min: 10000, max: 100000, currency: 'AED' },
      timeline: '6-12months',
      purpose: 'rent',
      responseRate: 0,
      occupation: undefined,
      income: undefined,
    };
    const score = calculateLeadScore(lowerBudgetLead as never);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(60);
  });
});
