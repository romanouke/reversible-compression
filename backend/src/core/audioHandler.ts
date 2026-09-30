import path from 'node:path'
import fsp from 'node:fs/promises'
import { runFfmpeg, type ProgressReporter } from './ffmpeg.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('audioHandler')

export interface AudioSplit {
  audioPath: string | null
  hasAudio: boolean
}

/**
 * Audio is detached once with stream copy and never segmented. AAC carries
 * priming/padding at every boundary, so cutting it into thousands of pieces
 * accumulates timing drift (6.000s became 6.213s in the first experiment).
 */
export async function extractAudio(inputPath: string, outputDir: string, hasAudio: boolean): Promise<AudioSplit> {
  await fsp.mkdir(outputDir, { recursive: true })
  if (!hasAudio) return { audioPath: null, hasAudio: false }

  const audioPath = path.join(outputDir, 'audio.m4a')
  await runFfmpeg({
    args: ['-i', inputPath, '-map', '0:a:0', '-vn', '-c:a', 'copy', audioPath],
  })
  log.info('Audio extracted with stream copy')
  return { audioPath, hasAudio: true }
}

/** Remuxes the restored video stream with the untouched audio stream. */
export async function muxAudio(
  videoPath: string,
  audioPath: string | null,
  outputPath: string,
  durationSec: number,
  onProgress?: ProgressReporter,
): Promise<void> {
  if (!audioPath) {
    // Nothing to remux: copy the video-only result to the final destination.
    await fsp.copyFile(videoPath, outputPath)
    return
  }

  await runFfmpeg({
    args: [
      '-i',
      videoPath,
      '-i',
      audioPath,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'copy',
      '-c:a',
      'copy',
      outputPath,
    ],
    durationSec,
    onProgress,
  })
  log.info('Audio muxed back with stream copy')
}

/** Removes the video stream, keeping only audio with stream copy. */
export async function extractAudioOnly(inputPath: string, outputDir: string, hasAudio: boolean): Promise<string | null> {
  return (await extractAudio(inputPath, outputDir, hasAudio)).audioPath
}
