import type { Response } from 'express';
import type { ApiResponse } from '../types';

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly correlationId?: string;
}

export const buildErrorResponse = (
  res: Response,
  statusCode: number,
  error: ApiError,
): Response<ApiResponse<null>> =>
  res.status(statusCode).json({
    success: false,
    message: error.message,
    error: {
      code: error.code,
      details: error.details,
    },
  });

export const normalizeError = (err: unknown): ApiError => {
  if (err && typeof err === 'object' && 'statusCode' in err && 'code' in err) {
    const appError = err as {
      statusCode: number;
      code: string;
      message: string;
      details?: unknown;
      cause?: unknown;
    };
    return {
      code: appError.code as string,
      message: appError.message as string,
      details: appError.details,
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
  };
};
