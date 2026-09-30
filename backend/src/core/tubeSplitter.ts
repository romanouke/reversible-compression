import fsp from 'node:fs/promises'
import path from 'node:path'
import { runFfmpeg } from './ffmpeg.js'
import { probeDuration } from './ffprobe.js'
import { isPermutation } from './tubeShuffler.js'
import type { TubeEntry, TubeMap } from '../types/job.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('tubeSplitter')

export interface SplitResult {
  tubeFiles: string[]
  /** Measured duration of each tube, in original order. */
  tubeDurations: number[]
}

export type ProgressReporter = (percent: number) => void

/**
 * Segments the video stream on keyframe boundaries with the segment muxer.
 * Stream copy cannot invent keyframes, so tubes follow the source GOP layout.
 */
export async function splitIntoTubes(
  inputPath: string,
  outputDir: string,
  tubeDurationSec: number,
  durationSec: number,
  onProgress?: ProgressReporter,
): Promise<string[]> {
  await fsp.mkdir(outputDir, { recursive: true })
  await runFfmpeg({
    args: [
      '-i',
      inputPath,
      '-map',
      '0:v:0',
      '-c',
      'copy',
      '-f',
      'segment',
      '-segment_time',
      String(tubeDurationSec),
      '-segment_format',
      'mp4',
      '-reset_timestamps',
      '1',
      path.join(outputDir, 'tube_%04d.mp4'),
    ],
    durationSec,
    onProgress: onProgress ? (percent) => onProgress(percent) : undefined,
  })

  const files = (await fsp.readdir(outputDir))
    .filter((name) => /^tube_\d+\.mp4$/.test(name))
    .sort()
    .map((name) => path.join(outputDir, name))

  if (files.length === 0) {
    throw new Error('Segmenting produced no tubes')
  }
  log.info('Segmented into tubes', { tube_count: files.length })
  return files
}

/**
 * Duration of each tube, probed one by one. Measuring beats assuming
 * tube_duration_sec: the segmenter cuts on the source's real keyframes.
 */
export async function measureTubeDurations(tubeFiles: string[], onProgress?: ProgressReporter): Promise<number[]> {
  const durations: number[] = []
  for (let i = 0; i < tubeFiles.length; i += 1) {
    durations.push(await probeDuration(tubeFiles[i] as string))
    onProgress?.(((i + 1) / Math.max(1, tubeFiles.length)) * 100)
  }
  return durations
}

/**
 * Splits the input and measures each tube's real duration, so the caller can
 * derive cut points that match the tube count exactly.
 */
export async function splitAndMeasure(
  inputPath: string,
  workDir: string,
  tubeDurationSec: number,
  durationSec: number,
  onProgress?: ProgressReporter,
): Promise<SplitResult> {
  const tubeDir = path.join(workDir, 'tubes')
  const tubeFiles = await splitIntoTubes(inputPath, tubeDir, tubeDurationSec, durationSec, onProgress)
  const tubeDurations = await measureTubeDurations(tubeFiles)
  return { tubeFiles, tubeDurations }
}

/**
 * Cut points of the shuffled output: cumulative durations of the tubes in the
 * order they were written, minus the final total. Always exactly `tubeCount - 1`
 * entries, which is what the restore step validates against.
 */
export function shuffledBoundaries(tubeDurations: number[], order: number[]): number[] {
  const boundaries: number[] = []
  let elapsed = 0
  for (let i = 0; i < order.length - 1; i += 1) {
    elapsed += tubeDurations[order[i] as number] ?? 0
    boundaries.push(Number(elapsed.toFixed(6)))
  }
  return boundaries
}

export function buildTubeMap(params: {
  mode: 'stream' | 'reencode'
  tubeCount: number
  tubeDurationSec: number
  shuffleSeed: number
  cutPoints: number[]
  compressedDurationSec?: number
  original: TubeMap['original']
  order: number[]
}): TubeMap {
  const { mode, tubeCount, tubeDurationSec, shuffleSeed, cutPoints, original, order } = params
  const durationSec = params.compressedDurationSec ?? original.duration_sec

  if (order.length !== tubeCount || !isPermutation(order)) {
    throw new Error('Shuffle order is not a valid permutation of the tube indexes')
  }
  if (cutPoints.length !== tubeCount - 1 || cutPoints.some((point) => !Number.isFinite(point) || point <= 0)) {
    throw new Error('Cut points do not match the tube count')
  }
  if (cutPoints.some((point, index) => index > 0 && point <= (cutPoints[index - 1] ?? 0))) {
    throw new Error('Cut points must be strictly increasing')
  }
  if (!Number.isFinite(durationSec) || durationSec <= (cutPoints[cutPoints.length - 1] ?? 0)) {
    throw new Error('Compressed duration must be after the final cut point')
  }

  const edges = [0, ...cutPoints, durationSec]
  const tubes: TubeEntry[] = Array.from({ length: tubeCount }, (_, index) => ({
    tube_id: index,
    original_index: order[index] as number,
    shuffled_index: index,
    start_sec: Number((edges[index] ?? 0).toFixed(6)),
    end_sec: Number((edges[index + 1] ?? durationSec).toFixed(6)),
  }))

  return {
    version: 1,
    mode,
    tube_count: tubeCount,
    tube_duration_sec: tubeDurationSec,
    shuffle_seed: shuffleSeed,
    cut_points: cutPoints.map((value) => Number(value.toFixed(6))),
    created_at: new Date().toISOString(),
    original,
    tubes,
  }
}

/** Concatenates tube files in the given order using stream copy. */
export async function concatTubes(
  tubeFiles: string[],
  order: number[],
  outputPath: string,
  durationSec: number,
  onProgress?: ProgressReporter,
): Promise<void> {
  if (tubeFiles.length !== order.length) {
    throw new Error('Tube count does not match the shuffle order length')
  }

  const listPath = path.join(path.dirname(outputPath), 'concat_list.txt')
  const lines = order.map((originalIndex) => {
    const file = tubeFiles[originalIndex]
    if (!file) throw new Error(`Missing tube file for index ${originalIndex}`)
    return `file '${file.replace(/'/g, "'\\''")}'`
  })
  await fsp.writeFile(listPath, `${lines.join('\n')}\n`, 'utf8')

  await runFfmpeg({
    args: ['-f', 'concat', '-safe', '0', '-i', listPath, '-map', '0:v:0', '-c', 'copy', outputPath],
    durationSec,
    onProgress: onProgress ? (percent) => onProgress(percent) : undefined,
  })
}
