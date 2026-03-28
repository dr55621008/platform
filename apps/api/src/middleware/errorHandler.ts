import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource?: string) {
    super(resource ? `${resource} not found` : 'Resource not found', 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number) {
    super(`Insufficient credits. Required: ${required}, Available: ${available}`, 402);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error
  logger.error({
    error: {
      message,
      stack: err.stack,
      statusCode,
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
    },
  });

  // Don't leak stack traces in production
  res.status(statusCode).json({
    error: {
      type: err.name,
      message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
}

// Need to import config here to avoid circular dependency
import { config } from '../config/index.js';
