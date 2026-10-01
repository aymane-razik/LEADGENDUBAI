import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { env } from '../config';
import * as schema from './schema';

let pool: Pool | undefined;
let database: NodePgDatabase<typeof schema> | undefined;

export const getPostgresDatabase = (): NodePgDatabase<typeof schema> => {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required to use the PostgreSQL repository layer');
  if (!pool) pool = new Pool({ connectionString: env.DATABASE_URL, max: 20, idleTimeoutMillis: 30_000 });
  if (!database) database = drizzle(pool, { schema });
  return database;
};

export const closePostgresDatabase = async (): Promise<void> => {
  if (pool) await pool.end();
  pool = undefined;
  database = undefined;
};

export const withPostgresTenant = async <T>(
  tenantId: string,
  work: (tx: Parameters<Parameters<NodePgDatabase<typeof schema>['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> => {
  if (!tenantId) throw new Error('tenantId is required for PostgreSQL work');
  return getPostgresDatabase().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return work(tx);
  });
};
