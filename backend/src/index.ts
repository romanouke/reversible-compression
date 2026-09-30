import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { ensureStorageDirs } from './utils/paths.js'
import { loadPersistedJobs } from './jobs/store.js'
import { startCleanupScheduler } from './jobs/cleanup.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { createLogger } from './utils/logger.js'
import compressRouter from './routes/compress.js'
import decompressRouter from './routes/decompress.js'
import statusRouter from './routes/status.js'
import downloadRouter from './routes/download.js'
import healthRouter from './routes/health.js'

const log = createLogger('app')

export function createApp(): express.Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          mediaSrc: ["'self'", 'blob:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(
    cors({
      // Restricted to the known frontend origins; no credentials, no wildcards.
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS policy`))
      },
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.use((req, res, next) => {
    const startedAt = Date.now()
    res.on('finish', () => {
      log.info('request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - startedAt,
      })
    })
    next()
  })

  // /health is the documented probe; /api/health is an alias so the frontend
  // can reach it through the same relative /api base it uses for everything else.
  app.use('/health', healthRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/compress', compressRouter)
  app.use('/api/decompress', decompressRouter)
  app.use('/api/status', statusRouter)
  app.use('/api/download', downloadRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

export async function start(): Promise<void> {
  ensureStorageDirs()

  const app = createApp()
  const restored = await loadPersistedJobs(config.paths.jobs).catch((error) => {
    log.error('Failed to restore job snapshots', { error: String(error) })
    return 0
  })
  startCleanupScheduler()

  app.listen(config.port, () => {
    log.info('Server listening', {
      port: config.port,
      restored_jobs: restored,
      cors_origins: config.corsOrigins,
    })
  })
}

const isEntrypoint = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`
if (isEntrypoint) {
  start().catch((error) => {
    log.error('Failed to start server', { error: String(error) })
    process.exit(1)
  })
}
