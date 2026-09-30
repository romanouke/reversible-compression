import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

const here = path.dirname(fileURLToPath(import.meta.url))
// src/ during tsx, dist/ after a build; both sit one level under backend/.
const backendRoot = path.resolve(here, '..')

export type Mode = 'stream' | 'reencode'
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

function str(name: string, fallback: string): string {
  const raw = process.env[name]
  return raw === undefined || raw.trim() === '' ? fallback : raw.trim()
}

function num(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}"`)
  }
  return parsed
}

function list(name: string, fallback: string[]): string[] {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function oneOf<T extends string>(name: string, fallback: T, allowed: readonly T[]): T {
  const raw = str(name, fallback).toUpperCase()
  const match = allowed.find((entry) => entry.toUpperCase() === raw)
  if (!match) {
    throw new Error(`Environment variable ${name} must be one of ${allowed.join(', ')}, got "${raw}"`)
  }
  return match
}

const storageRoot = path.resolve(backendRoot, str('REVCOMP_STORAGE_PATH', path.join(backendRoot, 'storage')))

export const config = {
  port: num('REVCOMP_PORT', 8000),
  logLevel: oneOf<LogLevel>('REVCOMP_LOG_LEVEL', 'INFO', ['DEBUG', 'INFO', 'WARNING', 'ERROR'] as const),
  logFormat: oneOf('REVCOMP_LOG_FORMAT', 'json', ['json', 'pretty'] as const),
  corsOrigins: list('REVCOMP_CORS_ORIGINS', ['http://localhost:5173']),

  ffmpegPath: str('REVCOMP_FFMPEG_PATH', ''),
  ffprobePath: str('REVCOMP_FFPROBE_PATH', ''),

  maxUploadBytes: num('REVCOMP_MAX_UPLOAD_MB', 500) * 1024 * 1024,
  maxMapBytes: num('REVCOMP_MAX_MAP_MB', 10) * 1024 * 1024,
  maxConcurrentJobs: Math.max(1, Math.trunc(num('REVCOMP_MAX_CONCURRENT_JOBS', 1))),
  jobTtlHours: num('REVCOMP_JOB_TTL_HOURS', 24),

  defaultMode: oneOf<Mode>('REVCOMP_DEFAULT_MODE', 'stream', ['stream', 'reencode'] as const),
  defaultCodec: str('REVCOMP_DEFAULT_CODEC', 'libx264'),
  defaultPreset: str('REVCOMP_DEFAULT_PRESET', 'medium'),
  defaultCrf: num('REVCOMP_DEFAULT_CRF', 23),
  defaultTubeDurationSec: num('REVCOMP_TUBE_DURATION_SEC', 1.0),

  targetFps: num('REVCOMP_TARGET_FPS', 30),
  keyframeIntervalSec: num('REVCOMP_KEYFRAME_INTERVAL_SEC', 2),

  paths: {
    root: backendRoot,
    storage: storageRoot,
    input: path.join(storageRoot, 'input'),
    output: path.join(storageRoot, 'output'),
    temp: path.join(storageRoot, 'temp'),
    jobs: path.join(storageRoot, 'jobs'),
  },
} as const

export type AppConfig = typeof config
