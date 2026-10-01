import { analyticsMaterialized } from '../../../src/analytics/materialized';

describe('analytics materialized', () => {
  it('exposes refresh and get entry points', async () => {
    // In a real environment these would hit Mongo + Redis.
    // Here we only assert the contract exists and is callable.
    expect(typeof analyticsMaterialized.refresh).toBe('function');
    expect(typeof analyticsMaterialized.get).toBe('function');
    expect(typeof analyticsMaterialized.invalidate).toBe('function');
  });
});
