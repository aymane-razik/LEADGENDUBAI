import type { ILead } from '../../models';
import type { IUser } from '../../models';
import type { LeadPropertyType, LeadTimeline } from './types';

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly role: IUser['role'];
  readonly isActive: boolean;
  readonly team?: string;
  readonly territory?: string[];
  readonly propertyTypes?: LeadPropertyType[];
  readonly capacity: number;
  readonly currentLoad: number;
  readonly avgResponseTimeMinutes?: number;
  readonly conversionRate?: number;
  readonly language?: string;
  readonly preferredTimeline?: LeadTimeline[];
}

export interface AssignmentRule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly weight: number;
  readonly scope?: {
    readonly propertyType?: LeadPropertyType[];
    readonly timeline?: LeadTimeline[];
    readonly location?: string[];
    readonly source?: string[];
  };
  readonly strategy: AssignmentStrategy;
}

export type AssignmentStrategy =
  | 'round_robin'
  | 'least_load'
  | 'territory_match'
  | 'property_type_match'
  | 'timeline_match'
  | 'composite';

export interface AssignmentContext {
  readonly lead: {
    readonly id?: string;
    readonly locations?: string[];
    readonly propertyType?: LeadPropertyType[];
    readonly timeline?: LeadTimeline;
    readonly source?: string;
    readonly purpose?: string;
    readonly language?: string;
    readonly budget?: { min: number; max: number; currency: string };
  };
  readonly tenantId: string;
  readonly excludeAgentIds?: string[];
  readonly preferAgentIds?: string[];
  readonly requestedAgentId?: string;
  readonly rule?: AssignmentRule;
}

export interface AssignmentResult {
  readonly agentId: string;
  readonly agentName: string;
  readonly strategy: AssignmentStrategy;
  readonly ruleId?: string;
  readonly reason: string;
  readonly beforeLoad: number;
  readonly afterLoad: number;
}

export const RULESET_DEFAULT: AssignmentRule[] = [
  {
    id: 'owner_request',
    name: 'Owner requested agent',
    enabled: true,
    priority: 100,
    weight: 10,
    strategy: 'round_robin',
  },
  {
    id: 'territory_match',
    name: 'Territory match',
    enabled: true,
    priority: 80,
    weight: 5,
    strategy: 'territory_match',
  },
  {
    id: 'property_type_match',
    name: 'Property type match',
    enabled: true,
    priority: 60,
    weight: 4,
    strategy: 'property_type_match',
  },
  {
    id: 'timeline_match',
    name: 'Timeline match',
    enabled: true,
    priority: 40,
    weight: 3,
    strategy: 'timeline_match',
  },
  {
    id: 'least_load',
    name: 'Least load',
    enabled: true,
    priority: 20,
    weight: 2,
    strategy: 'least_load',
  },
  {
    id: 'round_robin_fallback',
    name: 'Round-robin fallback',
    enabled: true,
    priority: 0,
    weight: 1,
    strategy: 'round_robin',
  },
];

export const agentsToConsidered = (
  agents: Agent[],
  ctx: AssignmentContext,
): Agent[] => {
  let list = agents.filter(
    (a) => a.isActive && a.role === 'agent' && a.capacity > 0,
  );
  if (ctx.excludeAgentIds?.length) {
    const set = new Set(ctx.excludeAgentIds);
    list = list.filter((a) => !set.has(a.id));
  }
  if (ctx.preferAgentIds?.length) {
    const set = new Set(ctx.preferAgentIds);
    list = list.filter((a) => set.has(a.id));
  }
  return list;
};

export const scoreAgentForContext = (agent: Agent, ctx: AssignmentContext): number => {
  let score = 0;

  // Territory match
  if (agent.territory && ctx.lead.locations && ctx.lead.locations.length > 0) {
    const areaSet = new Set(ctx.lead.locations.map((v) => v.toLowerCase()));
    const matches = agent.territory.filter((t) => areaSet.has(t.toLowerCase()));
    if (matches.length === 0) return 0;
    score += (matches.length / Math.max(1, ctx.lead.locations.length)) * 10;
  }

  // Property type match
  if (agent.propertyTypes && ctx.lead.propertyType && ctx.lead.propertyType.length > 0) {
    const typeSet = new Set(ctx.lead.propertyType);
    const matches = agent.propertyTypes.filter((t) => typeSet.has(t));
    if (matches.length === 0) return 0;
    score += (matches.length / Math.max(1, ctx.lead.propertyType.length)) * 8;
  }

  // Timeline match
  if (agent.preferredTimeline && ctx.lead.timeline) {
    if (agent.preferredTimeline.includes(ctx.lead.timeline)) {
      score += 5;
    } else return 0;
  }

  // Load penalty: prefer lower load
  const loadRatio = agent.currentLoad / Math.max(1, agent.capacity);
  score -= loadRatio * 6;

  // Response time bonus
  if (agent.avgResponseTimeMinutes != null) {
    if (agent.avgResponseTimeMinutes <= 30) score += 3;
    else if (agent.avgResponseTimeMinutes <= 60) score += 1;
  }

  // Conversion rate bonus
  if (agent.conversionRate != null) {
    if (agent.conversionRate >= 0.15) score += 3;
    else if (agent.conversionRate >= 0.10) score += 1;
  }

  // Language match
  if (agent.language && ctx.lead.language && agent.language === ctx.lead.language) {
    score += 2;
  }

  return score;
};

export const pickByLeastLoad = (agents: Agent[]): Agent | undefined => {
  if (agents.length === 0) return undefined;
  return agents.reduce((best, current) => {
    const bestLoad = best.currentLoad / Math.max(1, best.capacity);
    const currentLoad = current.currentLoad / Math.max(1, current.capacity);
    return currentLoad < bestLoad ? current : best;
  });
};

export const pickByRoundRobin = (_agents: Agent[], _index: number): Agent | undefined => {
  if (_agents.length === 0) return undefined;
  return _agents[0];
};

export const assignAgent = (
  agents: Agent[],
  ctx: AssignmentContext,
  ruleSet = RULESET_DEFAULT,
): AssignmentResult => {
  const candidates = agentsToConsidered(agents, ctx);
  if (candidates.length === 0) {
    throw new Error('No eligible agents');
  }

  // If a specific agent is requested, validate and use it.
  if (ctx.requestedAgentId) {
    const requested = candidates.find((a) => a.id === ctx.requestedAgentId);
    if (requested) {
      return {
        agentId: requested.id,
        agentName: requested.name,
        strategy: 'round_robin',
        reason: 'Agent requested by caller',
        beforeLoad: requested.currentLoad,
        afterLoad: requested.currentLoad + 1,
      };
    }
  }

  // Apply rule priority ordering
  const applicableRules = ruleSet
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of applicableRules) {
    let chosen: Agent | undefined;

    if (rule.strategy === 'round_robin' && rule.priority >= 100) {
      // A high-priority owner request only applies when a specific eligible agent was requested.
      chosen = ctx.requestedAgentId
        ? candidates.find((agent) => agent.id === ctx.requestedAgentId)
        : undefined;
    } else if (rule.strategy === 'territory_match') {
      const scored = candidates.map((a) => ({ agent: a, score: scoreAgentForContext(a, ctx) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      chosen = scored.length > 0 ? scored[0].agent : undefined;
    } else if (rule.strategy === 'property_type_match') {
      const leadTypes = ctx.lead.propertyType ?? [];
      const scored = candidates.map((a) => {
        const match = a.propertyTypes?.some((t) => leadTypes.includes(t));
        return { agent: a, score: match ? 10 : 0 };
      }).filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      chosen = scored.length > 0 ? scored[0].agent : undefined;
    } else if (rule.strategy === 'timeline_match') {
      const scored = candidates.map((a) => {
        const match = ctx.lead.timeline ? a.preferredTimeline?.includes(ctx.lead.timeline) : false;
        return { agent: a, score: match ? 5 : 0 };
      }).filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      chosen = scored.length > 0 ? scored[0].agent : undefined;
    } else if (rule.strategy === 'least_load') {
      chosen = pickByLeastLoad(candidates);
    } else if (rule.strategy === 'composite') {
      const scored = candidates.map((a) => ({
        agent: a,
        score: scoreAgentForContext(a, ctx),
      })).sort((a, b) => b.score - a.score);
      chosen = scored.length > 0 ? scored[0].agent : undefined;
    }

    if (chosen) {
      return {
        agentId: chosen.id,
        agentName: chosen.name,
        strategy: rule.strategy,
        ruleId: rule.id,
        reason: `Assigned via ${rule.name}`,
        beforeLoad: chosen.currentLoad,
        afterLoad: chosen.currentLoad + 1,
      };
    }
  }

  // Absolute fallback
  const fallback = candidates[0];
  return {
    agentId: fallback.id,
    agentName: fallback.name,
    strategy: 'round_robin',
    reason: 'Assigned via round-robin fallback',
    beforeLoad: fallback.currentLoad,
    afterLoad: fallback.currentLoad + 1,
  };
};
