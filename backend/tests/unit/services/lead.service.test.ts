import { calculateSimilarity } from '../../../src/services/deduplication.service';

describe('lead service helpers', () => {
  it('calculates duplicate similarity as normalized score', () => {
    const leadA = {
      email: 'a@example.com',
      phone: '+971501234567',
      firstName: 'Ali',
      lastName: 'Khan',
      budget: { min: 500000, max: 1000000 },
    };
    const leadB = {
      email: 'a@example.com',
      phone: '+971501234567',
      firstName: 'Aly',
      lastName: 'Khan',
      budget: { min: 700000, max: 1200000 },
    };

    const score = calculateSimilarity(leadA as never, leadB as never);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1);
  });
});
