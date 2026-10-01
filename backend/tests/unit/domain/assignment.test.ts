import {
  RULESET_DEFAULT,
  agentsToConsidered,
  scoreAgentForContext,
  assignAgent,
  type Agent,
  type AssignmentContext,
} from '../../../src/domain/lead/assignment';
import type { LeadPropertyType, LeadTimeline } from '../../../src/domain/lead/types';

describe('domain assignment', () => {
  const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
    id: 'agent-1',
    name: 'Ahmed',
    role: 'agent',
    isActive: true,
    team: 'Dubai Marina',
    territory: ['Dubai Marina', 'Downtown'],
    propertyTypes: ['apartment', 'villa'],
    capacity: 50,
    currentLoad: 10,
    avgResponseTimeMinutes: 25,
    conversionRate: 0.18,
    language: 'en',
    preferredTimeline: ['immediate', '1-3months'],
    ...overrides,
  });

  const ctx: AssignmentContext = {
    lead: {
      id: 'lead-1',
      locations: ['Dubai Marina'],
      propertyType: ['apartment'] as LeadPropertyType[],
      timeline: 'immediate' as LeadTimeline,
      source: 'bayut',
      purpose: 'buy',
      language: 'en',
      budget: { min: 1_000_000, max: 2_000_000, currency: 'AED' },
    },
    tenantId: 'default',
  };

  it('filters only active agents with capacity', () => {
    const agents = [
      makeAgent({ isActive: true, capacity: 10 }),
      makeAgent({ isActive: false, capacity: 10 }),
      makeAgent({ isActive: true, capacity: 0 }),
    ];
    const considered = agentsToConsidered(agents, ctx);
    expect(considered).toHaveLength(1);
    expect(considered[0].id).toBe('agent-1');
  });

  it('excludes specific agent ids', () => {
    const agents = [makeAgent({ id: 'a1' }), makeAgent({ id: 'a2' })];
    const considered = agentsToConsidered(agents, { ...ctx, excludeAgentIds: ['a1'] });
    expect(considered.map((a) => a.id)).toEqual(['a2']);
  });

  it('scores territory match', () => {
    const agent = makeAgent({ territory: ['Dubai Marina'] });
    expect(scoreAgentForContext(agent, ctx)).toBeGreaterThan(0);
    const noMatch = makeAgent({ territory: ['Palm Jumeirah'] });
    expect(scoreAgentForContext(noMatch, ctx)).toBe(0);
  });

  it('scores property type match', () => {
    const agent = makeAgent({ propertyTypes: ['apartment'] });
    expect(scoreAgentForContext(agent, ctx)).toBeGreaterThan(0);
    const noMatch = makeAgent({ propertyTypes: ['land'] });
    expect(scoreAgentForContext(noMatch, ctx)).toBe(0);
  });

  it('scores timeline match', () => {
    const agent = makeAgent({ preferredTimeline: ['immediate'] });
    expect(scoreAgentForContext(agent, ctx)).toBeGreaterThan(0);
    const noMatch = makeAgent({ preferredTimeline: ['6-12months'] });
    expect(scoreAgentForContext(noMatch, ctx)).toBe(0);
  });

  it('penalizes high load', () => {
    const light = makeAgent({ currentLoad: 1, capacity: 50 });
    const heavy = makeAgent({ currentLoad: 45, capacity: 50 });
    expect(scoreAgentForContext(light, ctx)).toBeGreaterThan(scoreAgentForContext(heavy, ctx));
  });

  it('rewards fast response and high conversion', () => {
    const fast = makeAgent({ avgResponseTimeMinutes: 10, conversionRate: 0.25 });
    const slow = makeAgent({ avgResponseTimeMinutes: 90, conversionRate: 0.05 });
    expect(scoreAgentForContext(fast, ctx)).toBeGreaterThan(scoreAgentForContext(slow, ctx));
  });

  it('rewards language match', () => {
    const match = makeAgent({ language: 'en' });
    const noMatch = makeAgent({ language: 'ar' });
    expect(scoreAgentForContext(match, ctx)).toBeGreaterThan(scoreAgentForContext(noMatch, ctx));
  });

  it('assigns via rule priority', () => {
    const agents = [makeAgent({ territory: ['Dubai Marina'] })];
    const result = assignAgent(agents, ctx);
    expect(result.agentId).toBe('agent-1');
    expect(RULESET_DEFAULT.some((r) => r.id === result.ruleId)).toBe(true);
  });

  it('prefers least load when territory rules fail', () => {
    const agents = [
      makeAgent({ territory: [], currentLoad: 40, capacity: 50 }),
      makeAgent({ territory: [], currentLoad: 5, capacity: 50 }),
    ];
    const result = assignAgent(agents, { ...ctx, preferAgentIds: [] });
    expect(result.afterLoad).toBeGreaterThan(result.beforeLoad);
  });
});
