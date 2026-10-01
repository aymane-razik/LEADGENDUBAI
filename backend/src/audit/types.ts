export interface AuditInput {
  actorId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  correlationId: string;
  occurredAt?: Date;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
