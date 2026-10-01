import type { JwtPayload } from 'jsonwebtoken';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  code: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiErrorPayload;
}

export interface TokenPayload extends JwtPayload {
  userId: string;
  tenantId?: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
