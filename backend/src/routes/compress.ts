import { Router, type Request } from 'express'
import { config } from '../config.js'
import { enqueue } from '../jobs/runner.js'
import { runCompressPipeline } from '../jobs/pipelines.js'
import { claimUpload, discardUpload, uploadVideo } from '../middleware/upload.js'
import { assertLooksLikeVideo, parseCodec, parseCrf, parseFiniteNumber, parseMode, parsePreset, parseSeed } from '../utils/validate.js'
import type { CompressOptions } from '../types/job.js'
import { HttpError } from '../middleware/errors.js'

const router = Router()

function parseTubeDuration(raw: unknown): number {
  const value = parseFiniteNumber(raw ?? config.defaultTubeDurationSec, 'tube_duration_sec')
  if (value < 0.1 || value > 60) {
    throw new HttpError(400, '"tube_duration_sec" must be between 0.1 and 60')
  }
  return Number(value.toFixed(3))
}

function parseOptions(body: Request['body']): CompressOptions {
  const mode = parseMode(body.mode, config.defaultMode)
  return {
    mode,
    tubeDurationSec: parseTubeDuration(body.tube_duration_sec),
    shuffleSeed: parseSeed(body.shuffle_seed, 42),
    outputCodec: parseCodec(body.output_codec, config.defaultCodec),
    preset: parsePreset(body.preset, config.defaultPreset),
    crf: parseCrf(body.crf, config.defaultCrf),
  }
}

router.post('/', uploadVideo.single('video'), async (req, res, next) => {
  const file = req.file
  if (!file) {
    next(new HttpError(400, 'Missing "video" file field'))
    return
  }

  try {
    await assertLooksLikeVideo(file.path, file.originalname, file.mimetype)

    const options = parseOptions(req.body ?? {})
    const job = enqueue('compress', async (jobId) => {
      const inputPath = await claimUpload(jobId, file.path, file.originalname)
      await runCompressPipeline({ jobId, inputPath, originalName: file.originalname, options })
    })

    res.status(202).json({ job_id: job.id, status: job.status })
  } catch (error) {
    await discardUpload(file)
    next(error)
  }
})

export default router
