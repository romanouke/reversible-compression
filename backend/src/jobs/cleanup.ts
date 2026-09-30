import fsp from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { listJobs, jobDir, outputDir } from './store.js'
import { removeDir } from '../utils/paths.js'
import { createLogger } from '../utils/logger.js'
import { sanitizeFilename } from '../utils/validate.js'

const log = createLogger('cleanup')

const SWEEP_INTERVAL_MS = 60 * 60 * 1000

/** Uploads are stored as `{job_id}__{sanitized_name}`. */
export function storedUploadName(jobId: string, filename: string): string {
  return `${jobId}__${sanitizeFilename(filename)}`
}

async function removeJobInputs(jobId: string): Promise<void> {
  let entries: string[]
  try {
    entries = await fsp.readdir(config.paths.input)
  } catch {
    return
  }
  await Promise.all(
    entries
      .filter((name) => name.startsWith(`${jobId}__`))
      .map((name) => fsp.rm(path.join(config.paths.input, name), { force: true })),
  )
}

export interface CleanupStats {
  tempDirsRemoved: number
  outputDirsRemoved: number
}

/**
 * TTL sweep of storage/temp/job_* and storage/output/{job_id} for jobs that
 * finished longer ago than JOB_TTL_HOURS. No cron, no disk-pressure heuristics.
 */
export async function sweepExpiredJobs(now: number = Date.now()): Promise<CleanupStats> {
  const stats: CleanupStats = { tempDirsRemoved: 0, outputDirsRemoved: 0 }
  const cutoffMs = config.jobTtlHours * 60 * 60 * 1000

  for (const job of listJobs()) {
    if (job.status !== 'completed' && job.status !== 'failed') continue
    const finishedAt = job.finishedAt ? Date.parse(job.finishedAt) : Number.NaN
    if (!Number.isFinite(finishedAt) || now - finishedAt < cutoffMs) continue

    await removeDir(jobDir(job.id))
    stats.tempDirsRemoved += 1

    // The uploaded original lives in storage/input as `{job_id}__{name}`.
    await removeDir(outputDir(job.id))
    stats.outputDirsRemoved += 1

    await removeJobInputs(job.id)

    log.info('Removed expired job artefacts', { job_id: job.id, status: job.status })
  }

  return stats
}

let timer: NodeJS.Timeout | null = null

export function startCleanupScheduler(): void {
  if (timer) return
  timer = setInterval(() => {
    sweepExpiredJobs().catch((error) => log.error('Cleanup sweep failed', { error: String(error) }))
  }, SWEEP_INTERVAL_MS)
  timer.unref()
  log.info('Cleanup scheduler started', { interval_ms: SWEEP_INTERVAL_MS, ttl_hours: config.jobTtlHours })
}

export function stopCleanupScheduler(): void {
  if (!timer) return
  clearInterval(timer)
  timer = null
}
