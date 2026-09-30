import { Router } from 'express'
import { queueDepth } from '../jobs/runner.js'
import { requireJob } from '../jobs/store.js'
import { HttpError } from '../middleware/errors.js'

const router = Router()

router.get('/:job_id', (req, res, next) => {
  const jobId = req.params.job_id
  if (!jobId) {
    next(new HttpError(400, 'Missing job_id'))
    return
  }

  const job = requireJob(jobId)

  res.json({
    job_id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    queue_position: job.status === 'queued' ? queueDepth() : null,
    result: job.result,
    warnings: job.warnings,
    error: job.error,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
    finished_at: job.finishedAt,
    options: job.options,
  })
})

export default router
