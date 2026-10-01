import type { LeadStatus } from './types';

export type TransitionSideEffect =
  | 'emit_status_change'
  | 'update_next_followup'
  | 'increment_touchpoints'
  | 'clear_assigned_on_lost'
  | 'mark_qualified'
  | 'recompute_score';

export interface TransitionRule {
  readonly target: LeadStatus;
  readonly allowedFrom: LeadStatus[];
  readonly requiredFields?: string[];
  readonly sideEffects: TransitionSideEffect[];
  readonly autoFollowup?: boolean;
  readonly autoFollowupDays?: number;
  readonly scoreRecompute?: boolean;
}

export const LEAD_STATUS_FLOW: Record<LeadStatus, TransitionRule> = {
  new: {
    target: 'new',
    allowedFrom: [],
    sideEffects: ['recompute_score'],
    scoreRecompute: true,
  },
  contacted: {
    target: 'contacted',
    allowedFrom: ['new', 'nurturing'],
    sideEffects: ['emit_status_change', 'update_next_followup', 'increment_touchpoints'],
    autoFollowup: true,
    autoFollowupDays: 2,
    scoreRecompute: true,
  },
  qualified: {
    target: 'qualified',
    allowedFrom: ['contacted', 'new', 'meeting_scheduled'],
    requiredFields: ['budget', 'timeline', 'purpose'],
    sideEffects: ['emit_status_change', 'mark_qualified', 'update_next_followup', 'recompute_score'],
    autoFollowup: true,
    autoFollowupDays: 1,
    scoreRecompute: true,
  },
  meeting_scheduled: {
    target: 'meeting_scheduled',
    allowedFrom: ['qualified', 'contacted'],
    sideEffects: ['emit_status_change', 'update_next_followup'],
    autoFollowup: true,
    autoFollowupDays: 0,
    scoreRecompute: false,
  },
  viewing_done: {
    target: 'viewing_done',
    allowedFrom: ['meeting_scheduled', 'qualified'],
    sideEffects: ['emit_status_change', 'increment_touchpoints', 'update_next_followup'],
    autoFollowup: true,
    autoFollowupDays: 1,
    scoreRecompute: true,
  },
  negotiating: {
    target: 'negotiating',
    allowedFrom: ['viewing_done', 'qualified'],
    sideEffects: ['emit_status_change', 'update_next_followup'],
    autoFollowup: true,
    autoFollowupDays: 3,
    scoreRecompute: false,
  },
  deal_closed: {
    target: 'deal_closed',
    allowedFrom: ['negotiating', 'viewing_done', 'qualified'],
    sideEffects: ['emit_status_change'],
    scoreRecompute: false,
  },
  lost: {
    target: 'lost',
    allowedFrom: [
      'new',
      'contacted',
      'qualified',
      'meeting_scheduled',
      'viewing_done',
      'negotiating',
      'nurturing',
    ],
    sideEffects: ['emit_status_change', 'clear_assigned_on_lost'],
    scoreRecompute: false,
  },
  nurturing: {
    target: 'nurturing',
    allowedFrom: ['contacted', 'qualified', 'meeting_scheduled', 'viewing_done'],
    sideEffects: ['emit_status_change', 'update_next_followup'],
    autoFollowup: true,
    autoFollowupDays: 14,
    scoreRecompute: false,
  },
};

export interface TransitionContext {
  readonly leadId: string;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly correlationId: string;
  readonly reason?: string;
  readonly effectiveAt?: Date;
  readonly ip?: string;
  readonly userAgent?: string;
}

export interface TransitionResult {
  readonly allowed: boolean;
  readonly rule?: TransitionRule;
  readonly reasons: string[];
  readonly sideEffects: TransitionSideEffect[];
  readonly nextFollowup?: Date;
  readonly markQualified?: boolean;
  readonly recomputeScore?: boolean;
  readonly clearAssigned?: boolean;
}

export const validateTransition = (
  current: LeadStatus,
  target: LeadStatus,
  context: TransitionContext,
): TransitionResult => {
  const rule = LEAD_STATUS_FLOW[target];
  if (!rule) {
    return {
      allowed: false,
      reasons: [`Unknown target status: ${target}`],
      sideEffects: [],
    };
  }

  if (current === target) {
    return {
      allowed: false,
      reasons: [`Target status is already current: ${target}`],
      sideEffects: [],
    };
  }

  if (!rule.allowedFrom.includes(current)) {
    return {
      allowed: false,
      reasons: [`Transition from ${current} to ${target} is not allowed. Allowed from: ${rule.allowedFrom.join(', ')}`],
      sideEffects: [],
    };
  }

  const reasons: string[] = [];
  if (rule.requiredFields && rule.requiredFields.length > 0) {
    // In a real implementation we'd check the lead here; for the domain function we just record the contract.
    reasons.push(`Transition to ${target} requires fields: ${rule.requiredFields.join(', ')}`);
  }

  const sideEffects: TransitionSideEffect[] = [...rule.sideEffects];
  let nextFollowup: Date | undefined;
  let markQualified: boolean | undefined;
  let recomputeScore: boolean | undefined;
  let clearAssigned: boolean | undefined;

  if (rule.autoFollowup && rule.autoFollowupDays !== undefined) {
    const effective = context.effectiveAt ?? new Date();
    const d = new Date(effective);
    d.setDate(d.getDate() + rule.autoFollowupDays);
    nextFollowup = d;
    if (!sideEffects.includes('update_next_followup')) {
      sideEffects.push('update_next_followup');
    }
  }

  if (sideEffects.includes('mark_qualified')) {
    markQualified = true;
  }

  if (sideEffects.includes('recompute_score') || rule.scoreRecompute) {
    recomputeScore = true;
  }

  if (sideEffects.includes('clear_assigned_on_lost')) {
    clearAssigned = true;
  }

  return {
    allowed: true,
    rule,
    reasons,
    sideEffects,
    nextFollowup,
    markQualified,
    recomputeScore,
    clearAssigned,
  };
};

export const summarizeTransitionSideEffects = (result: TransitionResult): string => {
  if (!result.allowed) {
    return result.reasons.join('; ');
  }
  return [
    `Transition allowed: side effects [${result.sideEffects.join(', ')}]`,
    result.nextFollowup ? `Next follow-up set to ${result.nextFollowup.toISOString()}` : '',
    result.markQualified ? 'Marked as qualified' : '',
    result.clearAssigned ? 'Assigned agent cleared' : '',
  ]
    .filter(Boolean)
    .join('. ');
};
