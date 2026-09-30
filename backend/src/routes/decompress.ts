import { Router } from 'express'
import { enqueue } from '../jobs/runner.js'
import { runDecompressPipeline } from '../jobs/pipelines.js'
import { claimUpload, discardUpload, uploadDecompress } from '../middleware/upload.js'
import { assertLooksLikeVideo } from '../utils/validate.js'
import { HttpError } from '../middleware/errors.js'
import { config } from '../config.js'
import { fileSize } from '../utils/paths.js'

const router = Router()

router.post('/', uploadDecompress, async (req, res, next) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  const videoFile = files?.compressed_video?.[0]
  const mapFile = files?.tube_map?.[0]

  try {
    if (!videoFile || !mapFile) {
      next(new HttpError(400, 'Both "compressed_video" and "tube_map" fields are required'))
      return
    }

    await assertLooksLikeVideo(videoFile.path, videoFile.originalname, videoFile.mimetype)
    if ((await fileSize(mapFile.path)) > config.maxMapBytes) {
      throw new HttpError(413, `Tube map exceeds the ${Math.round(config.maxMapBytes / (1024 * 1024))}MB map limit`)
    }

    const job = enqueue('decompress', async (jobId) => {
      const [compressedPath, mapPath] = await Promise.all([
        claimUpload(jobId, videoFile.path, videoFile.originalname),
        claimUpload(jobId, mapFile.path, mapFile.originalname),
      ])
      await runDecompressPipeline({ jobId, compressedPath, mapPath })
    })

    res.status(202).json({ job_id: job.id, status: job.status })
  } catch (error) {
    await Promise.all([discardUpload(videoFile), discardUpload(mapFile)])
    next(error)
  }
})

export default router
