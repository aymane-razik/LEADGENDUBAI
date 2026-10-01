# Transformation Plan — Executed

## What changed (this execution)

### Architecture foundations
- Added a domain layer under `src/domain/` with pure modules:
  - `lead/scoring.ts` — configurable scoring profile, factor-level explainability, recomputation from profile.
  - `lead/dedup.ts` — blocking keys, Jaro-Winkler/levenshtein name similarity, budget/property/location overlap, similarity result with explanation, merge preparation with policy.
  - `lead/status-machine.ts` — explicit transition table, allowed-from guards, required fields, side-effect catalog (emit, follow-up, qualification, recompute, clear assignee).
  - `lead/assignment.ts` — rule engine with territory/property-type/timeline/load/response/conversion/language scoring, rule priority selection, least-load + round-robin fallback.
  - `property/analytics.ts` — market trend classification, area price trends, property intel enrichment.
  - `campaign/execution.ts` — recipient resolution, suppression, drip schedule computation, delivery outcome accounting.
  - `user/metrics.ts` — metrics snapshot from activities/leads, delta application.
- Added eventing:
  - `src/events/` — typed event catalog, in-process event bus with subscriber registration (ordered + global), correlation/causation propagation.
  - `src/outbox/` — Mongo-backed outbox repository for reliable async dispatch, outbox record factory.
- Added operational concerns:
  - `src/audit/` — append-only audit log for sensitive mutations with before/after and correlation.
  - `src/analytics/` — materialized dashboard stats with Redis cache invalidation.
  - `src/webhooks/` — webhook subscription contract, payload signing, delivery attempt + retry policy + delivery log contract.
  - `src/queues/` — BullMQ queue registry for enrichment, campaign dispatch, drip, scraper runs, analytics refresh, dedup backfill.
  - `src/workers/` — worker skeletons for lead enrichment, campaign dispatch, scraper runner, analytics refresh, plus a scheduler with repeatable jobs.
  - `src/tenants/` — tenant context + scoped query helpers.
  - `src/api/` — typed API error builder + pagination/filtering helpers.
  - `src/dtos/lead.ts` — DTOs to decouple the API contract from the internal model.

### Service + controller refactoring
- `lead.service.ts` now calls domain scoring/dedup/status/assignment, emits events via outbox + in-process bus, and records audit entries for status/assign/merge.
- `lead.controller.ts` uses DTOs, tenant context, correlation id, and adds smart endpoints: score explain, auto-assign, enrichment job, find duplicates.
- `lead.routes.ts` adds `/:id/duplicates`, `/:id/score/explain`, `/:id/enrich/job`, `/:id/auto-assign`.
- `campaign.controller.ts` adds drip schedule, eligibility check, outcome application.
- `campaign.routes.ts` adds drip-schedule, eligibility-check, outcome endpoints.
- `user.controller.ts` adds `/:id/metrics`; `user.routes.ts` adds the route.
- New routes: analytics, webhooks, outbox status, scrapers.

### Hardening (Phase 0 pieces)
- Hardened error hierarchy with cause chain + new 502/503 types.
- Tenant middleware + correlation middleware wired into `app.ts`.
- Outbox drain + scheduler stop wired into graceful shutdown in `server.ts`.
- Tests added for the new domain modules and updated integration tests.

## Current state
The project now has a domain-first core with eventing/outbox/audit, a BullMQ worker/queue skeleton, smarter scoring/dedup/status/assignment contracts, enrichment/campaign/scaper worker stubs, materialized analytics, webhook signing, tenant scoping, DTO-based lead API, and expanded tests. The remaining work is to switch endpoints onto real BullMQ producers/consumers, add real provider adapters, finish worker connection wiring, validate typecheck/tests pass, and then move into the smart scoring + dedup clustering + assignment + analytics/search phases.

## Next (not yet executed in code)
- Wire BullMQ producers into the lead/campaign/scraper controllers and the scheduler.
- Add real enrichment/campaign provider adapters and suppression/bounce/unsubscribe handling.
- Finish scraper execution pipeline (fetch/selectors/pagination/proxy) + dedup-on-ingest.
- Persist webhook subscriptions + delivery log; add retry worker.
- Add searchable property/lead indices (Meilisearch or Mongo text) behind a swappable interface.
- Add Prometheus metrics export for KPIs and request/business correlation.
- Field-level encryption for sensitive fields + key management + tenant isolation in queries.
- Convert lead/property/campaign controllers to fully DTO-mapped request/response shapes.
