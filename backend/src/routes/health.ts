import { Router } from 'express'
import { ffmpegAvailable, ffmpegVersion } from '../core/ffmpeg.js'
import { ffprobeAvailable, ffprobeVersion } from '../core/ffprobe.js'
import { config } from '../config.js'
import { freeSpaceGb } from '../utils/paths.js'
import { activeJobCount, queueDepth } from '../jobs/runner.js'
import { createLogger } from '../utils/logger.js'

const router = Router()
const log = createLogger('health')

router.get('/', async (_req, res) => {
  const [ffmpegOk, ffprobeOk] = await Promise.all([ffmpegAvailable(), ffprobeAvailable()])
  const storageFreeGb = freeSpaceGb(config.paths.storage)

  const healthy = ffmpegOk && ffprobeOk
  if (!healthy) {
    log.error('Health check degraded', { ffmpeg: ffmpegOk, ffprobe: ffprobeOk })
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks: {
      ffmpeg: {
        status: ffmpegOk ? 'ok' : 'missing',
        version: ffmpegVersion(),
      },
      ffprobe: {
        status: ffprobeOk ? 'ok' : 'missing',
        version: ffprobeVersion(),
      },
      storage: {
        status: storageFreeGb >= 0 ? 'ok' : 'unknown',
        free_gb: storageFreeGb,
      },
    },
    jobs: {
      active: activeJobCount(),
      queued: queueDepth(),
      max_concurrent: config.maxConcurrentJobs,
    },
  })
})

export default router
