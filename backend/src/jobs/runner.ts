import type { Job, JobType } from '../types/job.js'
import { createJob, updateJob } from './store.js'
import { config } from '../config.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('jobRunner')

type JobFactory = (jobId: string) => Promise<void>

interface QueueEntry {
  jobId: string
  type: JobType
  factory: JobFactory
}

const queue: QueueEntry[] = []
let active = 0

/**
 * In-process gate: at most MAX_CONCURRENT_JOBS pipelines run at once and the
 * rest wait in an in-memory queue. No Redis, no separate worker process.
 */
export function enqueue(type: JobType, factory: JobFactory): Job {
  const job = createJob(type, null)
  queue.push({ jobId: job.id, type, factory })
  drain()
  return job
}

function drain(): void {
  while (active < config.maxConcurrentJobs && queue.length > 0) {
    const entry = queue.shift()
    if (!entry) break
    active += 1
    void execute(entry).finally(() => {
      active -= 1
      drain()
    })
  }
}

async function execute(entry: QueueEntry): Promise<void> {
  const logForJob = log.child({ job_id: entry.jobId })
  logForJob.info('Job started', { job_type: entry.type })
  try {
    await entry.factory(entry.jobId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logForJob.error('Job failed', { error: message })
    updateJob(entry.jobId, { status: 'failed', stage: 'done', error: message })
  }
}

export function queueDepth(): number {
  return queue.length
}

export function activeJobCount(): number {
  return active
}
