import { spawn } from 'node:child_process'
import ffmpegStatic from 'ffmpeg-static'
import { config } from '../config.js'
import { createLogger } from '../utils/logger.js'

/** Consumer-facing progress sink. ffmpeg's raw progress also carries elapsed time. */
export type ProgressReporter = (percent: number) => void

export interface RunOptions {
  args: string[]
  /** Total media duration in seconds; enables -progress based percentage. */
  durationSec?: number
  /** Fraction of the reported progress this process represents. */
  progressWeight?: number
  /** Offset added to the emitted percentage, so parallel steps stay monotonic. */
  progressOffset?: number
  onProgress?: (percent: number, outTimeSec: number) => void
  cwd?: string
  signal?: AbortSignal
}

export class FfmpegError extends Error {
  readonly stderr: string
  readonly exitCode: number | null
  constructor(message: string, stderr: string, exitCode: number | null) {
    super(message)
    this.name = 'FfmpegError'
    this.stderr = stderr
    this.exitCode = exitCode
  }
}

const resolvedFfmpegPath = config.ffmpegPath || (ffmpegStatic as unknown as string)

export function ffmpegPath(): string {
  if (!resolvedFfmpegPath) {
    throw new Error('No FFmpeg binary available. Set REVCOMP_FFMPEG_PATH or install ffmpeg-static.')
  }
  return resolvedFfmpegPath
}

export function ffmpegVersion(): string {
  return config.ffmpegPath ? 'configured' : 'bundled'
}

/**
 * Runs ffmpeg with `-progress pipe:1` so progress is machine-readable, instead of
 * scraping the human-readable stderr banner.
 */
export function runFfmpeg(options: RunOptions): Promise<void> {
  const log = createLogger('ffmpeg')
  const bin = ffmpegPath()
  const args = ['-hide_banner', '-nostdin', '-y', ...options.args, '-progress', 'pipe:1', '-nostats']
  const weight = options.progressWeight ?? 1
  const offset = options.progressOffset ?? 0

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: options.cwd })
    let stderr = ''
    let stdoutBuffer = ''
    let outTimeSec = 0

    const onAbort = () => child.kill('SIGTERM')
    options.signal?.addEventListener('abort', onAbort, { once: true })

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdoutBuffer += chunk
      const lines = stdoutBuffer.split('\n')
      stdoutBuffer = lines.pop() ?? ''
      for (const line of lines) {
        const [key, rawValue] = line.split('=', 2)
        if (key === 'out_time_us' || key === 'out_time_ms') {
          const micros = Number(rawValue)
          if (Number.isFinite(micros)) {
            // Both keys are microseconds despite the out_time_ms name.
            outTimeSec = micros / 1_000_000
          }
        }
      }
      if (options.durationSec && options.durationSec > 0 && options.onProgress) {
        const ratio = Math.min(1, outTimeSec / options.durationSec)
        options.onProgress(Math.min(100, offset + ratio * weight * 100), outTimeSec)
      }
    })

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
      if (stderr.length > 64_000) stderr = stderr.slice(-64_000)
    })

    child.on('error', (error) => {
      options.signal?.removeEventListener('abort', onAbort)
      reject(new FfmpegError(`Failed to spawn ffmpeg: ${error.message}`, stderr, null))
    })

    child.on('close', (code) => {
      options.signal?.removeEventListener('abort', onAbort)
      if (options.signal?.aborted) {
        reject(new FfmpegError('FFmpeg run aborted', stderr, code))
        return
      }
      if (code === 0) {
        log.debug('ffmpeg finished', { code, out_time_sec: outTimeSec })
        resolve()
        return
      }
      const tail = stderr.trim().split('\n').slice(-8).join('\n')
      reject(new FfmpegError(`ffmpeg exited with code ${code}`, tail, code))
    })
  })
}

/**
 * Runs ffmpeg and resolves with stdout. Used by the `-f md5 -` content-hash
 * probe, where the digest is written to stdout instead of a file.
 */
export function runFfmpegCapture(args: string[]): Promise<string> {
  const bin = ffmpegPath()
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ['-hide_banner', '-nostdin', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
      if (stderr.length > 32_000) stderr = stderr.slice(-32_000)
    })
    child.on('error', (error) => reject(new FfmpegError(`Failed to spawn ffmpeg: ${error.message}`, stderr, null)))
    child.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new FfmpegError(`ffmpeg exited with code ${code}`, stderr.trim().split('\n').slice(-8).join('\n'), code))
    })
  })
}

export async function ffmpegAvailable(): Promise<boolean> {
  try {
    await runFfmpeg({ args: ['-version'] })
    return true
  } catch {
    return false
  }
}
