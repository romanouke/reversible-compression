import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import ffprobeStatic from 'ffprobe-static'
import { config } from '../config.js'
import type { VideoMeta } from '../types/job.js'

const execFileAsync = promisify(execFile)

const resolvedFfprobePath = config.ffprobePath || ffprobeStatic.path

export function ffprobePath(): string {
  if (!resolvedFfprobePath) {
    throw new Error('No ffprobe binary available. Set REVCOMP_FFPROBE_PATH or install ffprobe-static.')
  }
  return resolvedFfprobePath
}

export function ffprobeVersion(): string {
  return config.ffprobePath ? 'configured' : 'bundled'
}

function parseFps(raw: unknown): number {
  const value = String(raw ?? '0/1')
  const [numerator, denominator] = value.split('/').map(Number)
  if (!denominator || !Number.isFinite(numerator ?? NaN)) return 0
  return (numerator as number) / denominator
}

export async function probe(filePath: string): Promise<VideoMeta> {
  const { stdout } = await execFileAsync(
    ffprobePath(),
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath],
    { maxBuffer: 16 * 1024 * 1024 },
  )

  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string; size?: string }
    streams?: Array<{
      codec_type?: string
      codec_name?: string
      width?: number
      height?: number
      avg_frame_rate?: string
      r_frame_rate?: string
    }>
  }

  const streams = parsed.streams ?? []
  const video = streams.find((stream) => stream.codec_type === 'video')
  const audio = streams.find((stream) => stream.codec_type === 'audio')
  if (!video) throw new Error('Input has no video stream')

  const durationSec = Number(parsed.format?.duration ?? 0)
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error('Could not determine input duration')
  }

  const fps = parseFps(video.avg_frame_rate) || parseFps(video.r_frame_rate)

  return {
    durationSec,
    width: video.width ?? 0,
    height: video.height ?? 0,
    fps,
    videoCodec: video.codec_name ?? 'unknown',
    audioCodec: audio?.codec_name ?? null,
    hasAudio: Boolean(audio),
    sizeBytes: Number(parsed.format?.size ?? 0),
  }
}

/** Container duration in seconds, without inspecting streams. */
export async function probeDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync(
    ffprobePath(),
    ['-v', 'error', '-show_entries', 'format=duration', '-print_format', 'json', filePath],
    { maxBuffer: 1024 * 1024 },
  )
  const parsed = JSON.parse(stdout) as { format?: { duration?: string } }
  return Number(parsed.format?.duration ?? 0)
}

export interface Keyframe {
  timeSec: number
  pts: number
}

/**
 * Keyframe timestamps of a video stream. Used to measure real tube boundaries
 * instead of assuming `tube_duration_sec` lines up with the GOP layout.
 */
export async function findKeyframes(filePath: string): Promise<Keyframe[]> {
  const { stdout } = await execFileAsync(
    ffprobePath(),
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-skip_frame',
      'nokey',
      '-show_entries',
      'frame=best_effort_timestamp_time,pts',
      '-print_format',
      'json',
      filePath,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  )

  const parsed = JSON.parse(stdout) as { frames?: Array<{ best_effort_timestamp_time?: string; pts?: number }> }
  const frames = parsed.frames ?? []
  return frames
    .map((frame) => ({
      timeSec: Number(frame.best_effort_timestamp_time ?? 0),
      pts: Number(frame.pts ?? 0),
    }))
    .filter((frame) => Number.isFinite(frame.timeSec))
    .sort((a, b) => a.timeSec - b.timeSec)
}

/** Snaps nominal boundaries to real keyframes; it never manufactures a cut. */
export function buildCutPoints(idealTimes: number[], keyframes: Keyframe[], minGapSec = 1e-3): number[] {
  return matchCutPoints(idealTimes, keyframes, Number.POSITIVE_INFINITY, minGapSec)
}

/** Matches every intended tube boundary to a distinct measured output keyframe. */
export function matchCutPoints(
  idealTimes: number[],
  keyframes: Keyframe[],
  maxDriftSec: number,
  minGapSec = 1e-3,
): number[] {
  const times = keyframes.map((frame) => frame.timeSec).filter((time) => Number.isFinite(time) && time > minGapSec)
  const out: number[] = []
  let previous = 0
  let previousIdeal = 0
  let cursor = 0

  for (const ideal of idealTimes) {
    if (!Number.isFinite(ideal) || ideal <= previousIdeal) {
      throw new Error('Tube boundaries must be finite and strictly increasing')
    }
    previousIdeal = ideal
    while (cursor < times.length && (times[cursor] as number) <= previous + minGapSec) cursor += 1
    while (
      cursor + 1 < times.length &&
      Math.abs((times[cursor + 1] as number) - ideal) < Math.abs((times[cursor] as number) - ideal)
    ) {
      cursor += 1
    }
    const nearest = times[cursor]
    if (nearest === undefined || Math.abs(nearest - ideal) > maxDriftSec) {
      throw new Error(`No measured keyframe exists within ${maxDriftSec}s of tube boundary ${ideal.toFixed(3)}s`)
    }
    out.push(Number(nearest.toFixed(6)))
    previous = nearest
    cursor += 1
  }

  return out
}

/** Drops keyframes that land closer together than `minGapSec` to avoid duplicate tube boundaries. */
export function dedupeKeyframes(keyframes: Keyframe[], minGapSec: number): Keyframe[] {
  const out: Keyframe[] = []
  for (const frame of keyframes) {
    const previous = out[out.length - 1]
    if (!previous || frame.timeSec - previous.timeSec >= minGapSec - 1e-6) {
      out.push(frame)
    }
  }
  return out
}

export async function ffprobeAvailable(): Promise<boolean> {
  try {
    await execFileAsync(ffprobePath(), ['-version'])
    return true
  } catch {
    return false
  }
}
