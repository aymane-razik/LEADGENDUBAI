export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown, cause?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details, cause);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown, cause?: unknown) {
    super(401, message, 'UNAUTHORIZED', details, cause);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown, cause?: unknown) {
    super(403, message, 'FORBIDDEN', details, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown, cause?: unknown) {
    super(404, message, 'NOT_FOUND', details, cause);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict detected', details?: unknown, cause?: unknown) {
    super(409, message, 'CONFLICT', details, cause);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details?: unknown, cause?: unknown) {
    super(429, message, 'TOO_MANY_REQUESTS', details, cause);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown, cause?: unknown) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details, cause);
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Upstream service error', details?: unknown, cause?: unknown) {
    super(502, message, 'BAD_GATEWAY', details, cause);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details?: unknown, cause?: unknown) {
    super(503, message, 'SERVICE_UNAVAILABLE', details, cause);
  }
}
