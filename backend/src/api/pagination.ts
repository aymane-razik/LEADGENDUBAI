import type { SortField, SortOrder } from '../dtos/lead';

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface SortParams {
  readonly field: SortField;
  readonly order: SortOrder;
}

export interface FilterMap<T> {
  readonly [key: string]: T | undefined;
}

export const parsePage = (value: unknown, defaultPage = 1): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? n : defaultPage;
};

export const parseLimit = (value: unknown, defaultLimit = 20, maxLimit = 100): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return defaultLimit;
  return Math.min(n, maxLimit);
};

export const parseSort = (
  value: unknown,
  allowedFields: SortField[],
  defaultField: SortField = 'createdAt',
  defaultOrder: SortOrder = 'desc',
): SortParams => {
  if (typeof value !== 'string') {
    return { field: defaultField, order: defaultOrder };
  }

  const parts = value.split(':');
  const field = parts[0] && allowedFields.includes(parts[0] as SortField)
    ? (parts[0] as SortField)
    : defaultField;
  const order = parts[1] && (parts[1] === 'asc' || parts[1] === 'desc')
    ? (parts[1] as SortOrder)
    : defaultOrder;
  return { field, order };
};

export const applySort = <T extends object>(
  query: { sort(): { skip(limit: number): { lean(): Promise<T[]> } }; lean(): Promise<T[]> },
  sort: SortParams,
): { skip(limit: number): { lean(): Promise<T[]> } } => {
  const dir = sort.order === 'asc' ? 1 : -1;
  return (query as unknown as { sort(arg: Record<string, number>): unknown }).sort({
    [sort.field]: dir,
  }) as unknown as { skip(limit: number): { lean(): Promise<T[]> } };
};

export const paginationMeta = (
  page: number,
  limit: number,
  total: number,
): { page: number; limit: number; total: number; totalPages: number } => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
