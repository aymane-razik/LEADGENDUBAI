import type { FilterQuery, PipelineStage } from 'mongoose';
import type { TenantContext } from './context';

export type MaybeTenantQuery<T> = FilterQuery<T> & { tenantId?: string };

export const applyTenantFilter = <T>(
  filter: FilterQuery<T>,
  tenant: TenantContext,
): FilterQuery<T> => {
  return {
    ...filter,
    tenantId: tenant.tenantId,
  } as FilterQuery<T>;
};

export const applyTenantPipeline = (
  pipeline: PipelineStage[],
  tenant: TenantContext,
): PipelineStage[] => {
  return [
    { $match: { tenantId: tenant.tenantId } },
    ...pipeline,
  ];
};

export const ensureTenantFilter = <T>(
  filter: FilterQuery<T>,
  tenant?: TenantContext,
): FilterQuery<T> => {
  if (!tenant) return filter;
  return applyTenantFilter(filter, tenant);
};
