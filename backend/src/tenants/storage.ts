import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContext } from './context';

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export const runWithTenant = <T>(tenant: TenantContext, callback: () => T): T =>
  tenantStorage.run(tenant, callback);

export const currentTenant = (): TenantContext =>
  tenantStorage.getStore() ?? { tenantId: 'default' };

export const setCurrentTenant = (tenantId: string, tenantSlug?: string): void => {
  const store = tenantStorage.getStore();
  if (!store) throw new Error('Tenant context is not initialized for this request');
  Object.assign(store, { tenantId, tenantSlug });
};

export const scopedCacheKey = (key: string, tenantId = currentTenant().tenantId): string =>
  `tenant:${tenantId}:${key}`;
