export interface TenantContext {
  readonly tenantId: string;
  readonly tenantSlug?: string;
}

export interface TenantMeta {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly settings: TenantSettings;
}

export interface TenantSettings {
  readonly defaultRole: string;
  readonly locale: 'en' | 'ar';
  readonly timezone: string;
  readonly enabledFeatures: string[];
}

export type TenantScopedModel = {
  tenantId: string;
};

export const TENANT_ID_HEADER = 'x-tenant-id';
export const TENANT_SLUG_HEADER = 'x-tenant-slug';

export const isTenantIdFormat = (value: string): boolean =>
  /^[0-9a-fA-F]{24}$/.test(value);
