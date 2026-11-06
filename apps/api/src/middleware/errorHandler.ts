import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: 'Please correct the highlighted data.',
      code: 'VALIDATION_ERROR', details: { fields: err.flatten().fieldErrors } } });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status = err.code === 'P2002' ? 409 : err.code === 'P2025' ? 404 :
      err.code === 'P2003' ? 400 : 500;
    res.status(status).json({ error: {
      code: err.code,
      message: err.code === 'P2002' ? 'This record already exists.' :
        err.code === 'P2025' ? 'Record not found.' :
          err.code === 'P2003' ? 'Related record is invalid or still in use.' : 'Database error.',
    } });
    return;
  }

  // Generic error
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
