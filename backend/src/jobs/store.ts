import crypto from 'node:crypto'
import fsp from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { jobSnapshotPath, jobTempDir, jobOutputDir } from '../utils/paths.js'
import { ValidationError } from '../utils/validate.js'
import type { Job, JobFileEntry, JobType, StoredJobSnapshot } from '../types/job.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('jobStore')

/**
 * In-memory Map is the source of truth while the process lives; every transition
 * is mirrored to storage/jobs/{job_id}.json so state survives a restart.
 */
const jobs = new Map<string, Job>()
const fileRegistry = new Map<string, JobFileEntry[]>()
const md5Registry = new Map<string, string>()
const mapPathRegistry = new Map<string, string>()

export function createJob(type: JobType, options: StoredJobSnapshot['options']): Job {
  const now = new Date().toISOString()
  const job: Job = {
    id: crypto.randomUUID(),
    type,
    status: 'queued',
    progress: 0,
    stage: 'queued',
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
    options,
    result: null,
    error: null,
    warnings: [],
  }
  jobs.set(job.id, job)
  persist(job).catch((error) => {
    log.error('Failed to persist new job', { job_id: job.id, error: String(error) })
  })
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function requireJob(id: string): Job {
  const job = jobs.get(id)
  if (!job) throw new ValidationError(`Unknown job_id "${id}"`)
  return job
}

export function listJobs(): Job[] {
  return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function updateJob(
  id: string,
  patch: Partial<Pick<Job, 'status' | 'progress' | 'stage' | 'result' | 'error' | 'finishedAt'>> & {
    warnings?: string[]
  },
): Job {
  const job = requireJob(id)
  const next: Job = {
    ...job,
    ...patch,
    warnings: patch.warnings ?? job.warnings,
    updatedAt: new Date().toISOString(),
  }
  if (next.status === 'completed' || next.status === 'failed') {
    next.finishedAt = next.finishedAt ?? next.updatedAt
  }
  jobs.set(id, next)
  persist(next).catch((error) => {
    log.error('Failed to persist job update', { job_id: id, error: String(error) })
  })
  return next
}

export function addWarning(id: string, warning: string): void {
  const job = requireJob(id)
  if (job.warnings.includes(warning)) return
  updateJob(id, { warnings: [...job.warnings, warning] })
}

export function registerFile(id: string, entry: JobFileEntry): void {
  const list = fileRegistry.get(id) ?? []
  const without = list.filter((item) => item.type !== entry.type)
  fileRegistry.set(id, [...without, entry])
  void persist(requireJob(id))
}

export function registerFiles(id: string, entries: JobFileEntry[]): void {
  for (const entry of entries) {
    const list = fileRegistry.get(id) ?? []
    const without = list.filter((item) => item.type !== entry.type)
    fileRegistry.set(id, [...without, entry])
  }
  void persist(requireJob(id))
}

export function getFile(id: string, type: JobFileEntry['type']): JobFileEntry | undefined {
  return (fileRegistry.get(id) ?? []).find((entry) => entry.type === type)
}

export function listFiles(id: string): JobFileEntry[] {
  return fileRegistry.get(id) ?? []
}

export function setMd5(id: string, md5: string): void {
  md5Registry.set(id, md5)
  void persist(requireJob(id))
}

export function getMd5(id: string): string | undefined {
  return md5Registry.get(id)
}

export function setTubeMapPath(id: string, mapPath: string): void {
  mapPathRegistry.set(id, mapPath)
  void persist(requireJob(id))
}

export function getTubeMapPath(id: string): string | undefined {
  return mapPathRegistry.get(id)
}

export function jobDir(id: string): string {
  return jobTempDir(id)
}

export function outputDir(id: string): string {
  return jobOutputDir(id)
}

async function persist(job: Job): Promise<void> {
  const snapshot: StoredJobSnapshot = {
    job,
    files: listFiles(job.id),
    options: job.options,
    md5Original: getMd5(job.id) ?? null,
    tubeMapPath: getTubeMapPath(job.id) ?? null,
    sourceDurationSec: job.result?.durationSec ?? null,
  }
  const target = jobSnapshotPath(job.id)
  await fsp.mkdir(path.dirname(target), { recursive: true })
  await fsp.writeFile(target, JSON.stringify(snapshot, null, 2), 'utf8')
}

/** Reloads snapshots from disk so jobs still resolve after a restart. */
export async function loadPersistedJobs(jobsDir: string): Promise<number> {
  let restored = 0
  let entries: string[]
  try {
    entries = await fsp.readdir(jobsDir)
  } catch {
    return 0
  }

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue
    try {
      const raw = await fsp.readFile(path.join(jobsDir, entry), 'utf8')
      const snapshot = JSON.parse(raw) as StoredJobSnapshot
      if (!snapshot?.job?.id) continue

      // A job that was mid-flight when the process died can never finish now,
      // so it is surfaced as failed instead of appearing stuck in processing.
      const job = snapshot.job.status === 'processing' || snapshot.job.status === 'queued'
        ? {
            ...snapshot.job,
            status: 'failed' as const,
            error: snapshot.job.error ?? 'Job interrupted by a server restart',
            finishedAt: snapshot.job.finishedAt ?? new Date().toISOString(),
          }
        : snapshot.job

      jobs.set(job.id, job)
      if (snapshot.files?.length) fileRegistry.set(job.id, snapshot.files)
      if (snapshot.md5Original) md5Registry.set(job.id, snapshot.md5Original)
      if (snapshot.tubeMapPath) mapPathRegistry.set(job.id, snapshot.tubeMapPath)
      restored += 1
    } catch (error) {
      log.warn('Skipping unreadable job snapshot', { file: entry, error: String(error) })
    }
  }

  return restored
}

export function md5File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}
