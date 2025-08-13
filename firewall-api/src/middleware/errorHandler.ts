import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../types';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Don't leak sensitive information in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  const response: APIResponse<null> = {
    success: false,
    error: message,
    timestamp: new Date(),
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: APIResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    message: 'The requested endpoint does not exist',
    timestamp: new Date(),
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class APIError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'APIError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500): APIError => {
  return new APIError(message, statusCode);
};
