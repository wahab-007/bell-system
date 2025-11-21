import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error | HttpError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('API error', err);
  const status = err instanceof HttpError ? err.status : 500;
  const message = err.message || 'Unexpected error';
  res.status(status).json({ message });
};
