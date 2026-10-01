import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, integer, boolean, numeric, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// IDs remain text during the Mongo-to-Postgres strangler migration so legacy ObjectIds remain stable.
export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('tenants_slug_uq').on(table.slug)]);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('active'),
  profile: jsonb('profile').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('users_tenant_email_uq').on(table.tenantId, table.email), index('users_tenant_idx').on(table.tenantId)]);

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').notNull(),
  source: text('source'),
  email: text('email'),
  phone: text('phone'),
  score: integer('score').notNull().default(0),
  payload: jsonb('payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('leads_tenant_created_idx').on(table.tenantId, table.createdAt), index('leads_tenant_status_idx').on(table.tenantId, table.status)]);

export const activities = pgTable('activities', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('activities_tenant_lead_time_idx').on(table.tenantId, table.leadId, table.occurredAt)]);

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  channel: text('channel').notNull(),
  definition: jsonb('definition').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('campaigns_tenant_status_idx').on(table.tenantId, table.status)]);

export const properties = pgTable('properties', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  status: text('status').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  type: text('type').notNull(),
  purpose: text('purpose').notNull(),
  price: numeric('price', { precision: 16, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('AED'),
  area: text('area'),
  location: jsonb('location').notNull().default({}),
  payload: jsonb('payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('properties_tenant_status_idx').on(table.tenantId, table.status), index('properties_tenant_area_idx').on(table.tenantId, table.area)]);

export const outboxEvents = pgTable('outbox_events', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  eventType: text('event_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  payload: jsonb('payload').notNull(),
  attempts: integer('attempts').notNull().default(0),
  availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('outbox_pending_idx').on(table.availableAt, table.createdAt).where(sql`${table.publishedAt} is null`)]);
