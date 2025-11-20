/**
 * =============================================================================
 * CUSTOM ERROR CLASSES
 * =============================================================================
 * Domain-specific error classes for better error handling and debugging
 * =============================================================================
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict errors
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * WhatsApp-specific errors
 */
export class WhatsAppError extends AppError {
  constructor(message: string, public accountId?: string) {
    super(message, 500, 'WHATSAPP_ERROR');
    this.accountId = accountId;
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 500, 'DATABASE_ERROR', false); // Not operational - needs investigation
    this.originalError = originalError;
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    public service: string,
    public originalError?: unknown
  ) {
    super(message, 502, 'EXTERNAL_API_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Check if error is operational (expected) or programming error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Format error for client response
 */
export const formatErrorResponse = (error: Error) => {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error instanceof ValidationError && error.fields && { fields: error.fields }),
      },
    };
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      ...(isDevelopment && { stack: error.stack }),
    },
  };
};
