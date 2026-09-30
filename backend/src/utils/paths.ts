import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { config } from '../config.js'

export function safeJoin(base: string, requested: string): string {
  const resolvedBase = path.resolve(base)
  const resolved = path.resolve(resolvedBase, requested)
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
    throw new Error('Path traversal attempt')
  }
  return resolved
}

export function ensureStorageDirs(): void {
  for (const dir of [config.paths.storage, config.paths.input, config.paths.output, config.paths.temp, config.paths.jobs]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export async function ensureStorageDirsAsync(): Promise<void> {
  await Promise.all(
    [config.paths.storage, config.paths.input, config.paths.output, config.paths.temp, config.paths.jobs].map((dir) =>
      fsp.mkdir(dir, { recursive: true }),
    ),
  )
}

export function jobTempDir(jobId: string): string {
  return path.join(config.paths.temp, `job_${jobId}`)
}

export function jobSnapshotPath(jobId: string): string {
  return path.join(config.paths.jobs, `${jobId}.json`)
}

export function jobOutputDir(jobId: string): string {
  return path.join(config.paths.output, jobId)
}

export async function removeDir(dir: string): Promise<void> {
  await fsp.rm(dir, { recursive: true, force: true })
}

export async function fileSize(filePath: string): Promise<number> {
  const stat = await fsp.stat(filePath)
  return stat.size
}

export function freeSpaceGb(dir: string): number {
  try {
    const stat = fs.statfsSync(dir)
    // statfs returns block counts in frsize units; report GB with one decimal.
    return Math.round(((stat.bavail * stat.bsize) / 1024 ** 3) * 10) / 10
  } catch {
    return -1
  }
}
