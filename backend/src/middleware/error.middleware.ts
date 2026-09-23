import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../validators/lead.validator.js'

// Re-export so services/controllers can import HttpError from one place.
export { HttpError }

interface MongooseValidationError extends Error {
  name: 'ValidationError'
}

interface MongooseCastError extends Error {
  name: 'CastError'
}

function isMongooseValidationError(error: unknown): error is MongooseValidationError {
  return error instanceof Error && error.name === 'ValidationError'
}

function isMongooseCastError(error: unknown): error is MongooseCastError {
  return error instanceof Error && error.name === 'CastError'
}

/** Central error handler — must be registered after all routes. */
export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }

  if (isMongooseValidationError(error)) {
    res.status(400).json({ message: error.message })
    return
  }

  if (isMongooseCastError(error)) {
    res.status(400).json({ message: 'Invalid lead id' })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
}

/** 404 handler for unknown routes. */
export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' })
}
