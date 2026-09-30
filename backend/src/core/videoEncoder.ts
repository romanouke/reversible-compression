import { runFfmpeg, type ProgressReporter } from './ffmpeg.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('videoEncoder')

export interface ReencodeOptions {
  codec: string
  preset: string
  crf: number
}

/**
 * Normalises to CFR with a fixed keyframe interval. Stream copy can do neither,
 * so VFR input and missing keyframes only become manageable in reencode mode.
 */
export async function normalizeToCfr(
  inputPath: string,
  outputPath: string,
  targetFps: number,
  keyframeIntervalSec: number,
  durationSec: number,
  onProgress?: ProgressReporter,
): Promise<void> {
  const gopSize = Math.max(1, Math.round(targetFps * keyframeIntervalSec))
  await runFfmpeg({
    args: [
      '-i',
      inputPath,
      '-map',
      '0:v:0',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-fps_mode',
      'cfr',
      '-r',
      String(targetFps),
      '-g',
      String(gopSize),
      '-keyint_min',
      String(gopSize),
      '-sc_threshold',
      '0',
      outputPath,
    ],
    durationSec,
    onProgress,
  })
  log.info('Video normalised to CFR', { target_fps: targetFps, gop_size: gopSize })
}

/**
 * Re-encodes the shuffled video with the detached audio track. Always lossy,
 * so callers must never report `md5Match: true` for its output.
 */
export async function reencode(
  videoPath: string,
  audioPath: string | null,
  outputPath: string,
  options: ReencodeOptions,
  durationSec: number,
  onProgress?: ProgressReporter,
): Promise<void> {
  // Every -i must come before any output option, so the audio input is added
  // up front rather than next to its -map.
  const args = ['-i', videoPath]
  if (audioPath) args.push('-i', audioPath)

  args.push('-map', '0:v:0')
  if (audioPath) args.push('-map', '1:a:0')
  args.push('-force_key_frames', 'source')
  args.push('-c:v', options.codec)

  if (options.codec === 'libx264' || options.codec === 'libx265') {
    args.push('-crf', String(options.crf), '-preset', options.preset)
  } else if (options.codec === 'libvpx-vp9' || options.codec === 'libaom-av1') {
    args.push('-crf', String(options.crf), '-b:v', '0', '-row-mt', '1')
  } else {
    args.push('-q:v', String(options.crf))
  }

  args.push('-pix_fmt', 'yuv420p')
  if (audioPath) args.push('-c:a', 'aac', '-b:a', '128k')
  else args.push('-an')
  args.push(outputPath)

  await runFfmpeg({ args, durationSec, onProgress })
  log.info('Re-encoded', { codec: options.codec, crf: options.crf, preset: options.preset })
}
