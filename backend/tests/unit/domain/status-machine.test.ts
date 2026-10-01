import {
  LEAD_STATUS_FLOW,
  validateTransition,
  summarizeTransitionSideEffects,
} from '../../../src/domain/lead/status-machine';
import type { LeadStatus } from '../../../src/domain/lead/types';

describe('domain lead status machine', () => {
  const context = {
    leadId: 'lead-1',
    tenantId: 'default',
    actorId: 'agent-1',
    correlationId: 'corr-1',
    reason: 'Test transition',
  };

  it('defines a flow for every status', () => {
    const allStatuses: LeadStatus[] = [
      'new',
      'contacted',
      'qualified',
      'meeting_scheduled',
      'viewing_done',
      'negotiating',
      'deal_closed',
      'lost',
      'nurturing',
    ];
    for (const status of allStatuses) {
      expect(LEAD_STATUS_FLOW[status]).toBeDefined();
      expect(LEAD_STATUS_FLOW[status].target).toBe(status);
      expect(Array.isArray(LEAD_STATUS_FLOW[status].allowedFrom)).toBe(true);
    }
  });

  it('allows contacted from new with side effects', () => {
    const result = validateTransition('new', 'contacted', context);
    expect(result.allowed).toBe(true);
    expect(result.sideEffects).toContain('emit_status_change');
    expect(result.nextFollowup).toBeDefined();
  });

  it('allows qualified from contacted with qualification mark', () => {
    const result = validateTransition('contacted', 'qualified', context);
    expect(result.allowed).toBe(true);
    expect(result.markQualified).toBe(true);
    expect(result.recomputeScore).toBe(true);
  });

  it('rejects transition from new to deal_closed', () => {
    const result = validateTransition('new', 'deal_closed', context);
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('not allowed'))).toBe(true);
  });

  it('allows lost from any active stage and clears assignee', () => {
    const result = validateTransition('qualified', 'lost', context);
    expect(result.allowed).toBe(true);
    expect(result.clearAssigned).toBe(true);
  });

  it('sets follow-up for nurturing', () => {
    const result = validateTransition('qualified', 'nurturing', context);
    expect(result.allowed).toBe(true);
    expect(result.nextFollowup).toBeDefined();
  });

  it('rejects unknown target status', () => {
    const result = validateTransition('new', 'unknown' as LeadStatus, context);
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('Unknown'))).toBe(true);
  });

  it('rejects same-status transition', () => {
    const result = validateTransition('new', 'new', context);
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('already current'))).toBe(true);
  });

  it('summarizes side effects for allowed transition', () => {
    const result = validateTransition('new', 'contacted', context);
    const summary = summarizeTransitionSideEffects(result);
    expect(summary).toContain('allowed');
    expect(summary).toContain('emit_status_change');
  });

  it('summarizes reasons for disallowed transition', () => {
    const result = validateTransition('new', 'deal_closed', context);
    const summary = summarizeTransitionSideEffects(result);
    expect(summary).toContain('not allowed');
  });
});
