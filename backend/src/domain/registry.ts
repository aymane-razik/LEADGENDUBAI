export { eventBus, createChildBus } from '../events/bus';
export type { EventHandler, EventBus } from '../events/bus';
export * from '../events/types';
export { outboxRepository } from '../outbox/repository';
export type { OutboxRepository, OutboxEventRecord } from '../outbox/repository';
export { auditLog } from '../audit/audit';
export type { AuditEntry } from '../audit/audit';
export { analyticsMaterialized } from '../analytics/materialized';
export { webhookDispatcher } from '../webhooks/dispatcher';
export type { WebhookSubscription, WebhookDelivery } from '../webhooks/dispatcher';
export { applyTenantFilter, applyTenantPipeline, ensureTenantFilter } from '../tenants/queries';
export {
  defaultScoringProfile,
  calculateLeadScore,
  classifyQuality,
  classifyIntent,
  calculateUrgency,
  calculateProbability,
  recomputeFromProfile,
} from './lead/scoring';
export {
  DEFAULT_DEDUP_CONFIG,
  computeSimilarity,
  isDuplicateCandidate,
  prepareMerge,
  emailsMatch,
  phonesMatch,
  nameSimilarity,
  budgetsOverlap,
  levenshteinSimilarity,
} from './lead/dedup';
export {
  validateTransition,
  LEAD_STATUS_FLOW,
  summarizeTransitionSideEffects,
} from './lead/status-machine';
export {
  assignAgent,
  RULESET_DEFAULT,
  agentsToConsidered,
  scoreAgentForContext,
} from './lead/assignment';
export {
  computeAreaPriceTrends,
  classifyMarketTrend,
  enrichPropertyIntel,
} from './property/analytics';
export {
  resolveRecipient,
  isEligibleForCampaign,
  computeDripSchedule,
  applyDeliveryOutcome,
} from './campaign/execution';
export { computeMetricsFromActivities, applyDelta } from './user/metrics';
