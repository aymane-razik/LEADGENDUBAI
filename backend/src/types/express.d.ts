import type { Request } from 'express';
import type { TokenPayload } from './api';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      requestId?: string;
    }
  }
}

export type TypedRequest<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, string | string[]>,
> = Request<TParams, unknown, TBody, TQuery>;
