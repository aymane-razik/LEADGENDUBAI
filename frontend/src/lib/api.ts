import axios from 'axios';
import { apiBaseUrl, apiPrefix } from './utils';
import { localDemoIsActive, runLocalDemo, shouldUseLocalDemo } from './demo-api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const correlationId = (typeof crypto !== 'undefined' && crypto.randomUUID())
    ?? `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  config.headers['x-correlation-id'] = correlationId;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as (typeof error.config & { _sessionRetried?: boolean }) | undefined;
    const url = String(request?.url ?? '');
    const authEndpoint = /\/auth\/(login|logout|refresh|forgot-password|reset-password)/.test(url);
    // Session bootstrap is expected to return 401 for a signed-out visitor. Retrying
    // refresh and navigating to /login from that request reloads the login page,
    // which bootstraps the same request again and creates a request storm.
    const sessionBootstrapEndpoint = /\/auth\/me(?:[?#]|$)/.test(url);
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
    const shouldHandleSession = !authEndpoint && !sessionBootstrapEndpoint;
    if (error.response?.status === 401 && request && !request._sessionRetried && shouldHandleSession) {
      request._sessionRetried = true;
      try {
        await api.post(`${apiPrefix}/auth/refresh`);
        return await api.request(request);
      } catch {
        if (typeof window !== 'undefined' && !isLoginPage) window.location.replace('/login');
      }
    } else if (error.response?.status === 401 && typeof window !== 'undefined' && shouldHandleSession && !isLoginPage) {
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

const requestWithDemoFallback = async <T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> => {
  if (localDemoIsActive()) return runLocalDemo(method, `${apiPrefix}${path}`, body, params) as T;
  try {
    const response = await api.request<T>({ method, url: `${apiPrefix}${path}`, data: body, params });
    return response.data;
  } catch (error) {
    if (!shouldUseLocalDemo(error, method, path, body)) throw error;
    return runLocalDemo(method, `${apiPrefix}${path}`, body, params) as T;
  }
};

export const apiGet = async <T>(path: string, params?: Record<string, unknown>): Promise<T> => requestWithDemoFallback<T>('GET', path, undefined, params);

export const apiPost = async <T>(path: string, body?: unknown): Promise<T> => requestWithDemoFallback<T>('POST', path, body);

export const apiPut = async <T>(path: string, body?: unknown): Promise<T> => requestWithDemoFallback<T>('PUT', path, body);

export const apiPatch = async <T>(path: string, body?: unknown): Promise<T> => requestWithDemoFallback<T>('PATCH', path, body);

export const apiDelete = async <T>(path: string): Promise<T> => requestWithDemoFallback<T>('DELETE', path);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as { message?: unknown; error?: { message?: unknown; details?: unknown } } | undefined;
    const details = response?.error?.details;
    const detailText = Array.isArray(details)
      ? details.find((item) => typeof item === 'string') ?? details.find((item) => typeof item?.message === 'string')?.message
      : details && typeof details === 'object'
        ? Object.values(details as Record<string, unknown>).flatMap((value) => Array.isArray(value) ? value : [value]).find((item) => typeof item === 'string')
        : undefined;
    if (typeof detailText === 'string') return `${typeof response?.message === 'string' ? response.message : fallback}: ${detailText}`;
    if (typeof response?.message === 'string' && response.message.trim()) return response.message;
    if (typeof response?.error?.message === 'string' && response.error.message.trim()) return response.error.message;
    if (error.code === 'ERR_NETWORK') return 'The demo API is unreachable. Check that the demo services are running.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Backend responses are wrapped in `{ success, message, data }` envelopes.
 * `unwrap` returns the inner payload when an envelope is present, otherwise
 * the response itself (so it is safe to call on already-unwrapped data).
 */
export function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * List endpoints return a plain array inside the envelope (no total), while
 * the frontend expects `{ items, total }`. Normalizes both shapes.
 */
export function toList<T>(res: unknown): { items: T[]; total: number } {
  const unwrapped = unwrap(res) as T[] | { items?: T[]; total?: number } | null | undefined;
  const withId = (item: T): T => {
    const rec = item as { id?: string; _id?: string } | null;
    if (rec && typeof rec === 'object' && !rec.id && rec._id) {
      return { ...rec, id: rec._id } as T;
    }
    return item;
  };
  if (Array.isArray(unwrapped)) {
    return { items: unwrapped.map(withId), total: unwrapped.length };
  }
  if (unwrapped && typeof unwrapped === 'object') {
    const obj = unwrapped as { items?: T[]; total?: number };
    const items = (obj.items ?? []).map(withId);
    return { items, total: obj.total ?? items.length };
  }
  return { items: [], total: 0 };
}

export default api;
