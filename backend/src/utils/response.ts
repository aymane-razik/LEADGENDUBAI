import type { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '../types';

export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: PaginationMeta,
): Response<ApiResponse<T>> => {
  return res.json({
    success: true,
    message,
    data,
    meta,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: { code: string; details?: unknown },
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

export const paginatedResponse = <T>(
  res: Response,
  data: T,
  page: number,
  limit: number,
  total: number,
  message = 'Request successful',
): Response<ApiResponse<T>> => {
  const totalPages = Math.ceil(total / limit);
  return successResponse(res, message, data, { page, limit, total, totalPages });
};
