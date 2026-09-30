import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ValidationError } from '../utils/validate.js'
import { config } from '../config.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('http')

export class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Endpoint not found' })
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) return

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res
        .status(413)
        .json({ message: `File exceeds the ${Math.round(config.maxUploadBytes / (1024 * 1024))}MB upload limit` })
      return
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      // Usually a required multipart field was spelled wrong or omitted.
      res.status(400).json({ message: `Unexpected file field "${error.field ?? 'unknown'}"` })
      return
    }
    res.status(400).json({ message: `Upload rejected: ${error.message}` })
    return
  }

  if (error instanceof ValidationError || error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error'
  log.error('Unhandled request error', { path: req.path, error: message })
  res.status(500).json({ message })
}
