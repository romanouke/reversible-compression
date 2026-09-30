import crypto from 'node:crypto'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { findKeyframes, matchCutPoints, probe, probeDuration } from '../core/ffprobe.js'
import { runFfmpeg, runFfmpegCapture } from '../core/ffmpeg.js'
import { extractAudio, muxAudio } from '../core/audioHandler.js'
import { buildTubeMap, concatTubes, shuffledBoundaries, splitAndMeasure } from '../core/tubeSplitter.js'
import { fisherYates } from '../core/tubeShuffler.js'
import { planRestore } from '../core/tubeRestorer.js'
import { normalizeToCfr, reencode } from '../core/videoEncoder.js'
import { config } from '../config.js'
import { addWarning, jobDir, md5File, outputDir, registerFiles, setMd5, updateJob } from './store.js'
import type { CompressOptions, JobFileEntry, JobStage, TubeMap, VideoMeta } from '../types/job.js'
import { ValidationError } from '../utils/validate.js'
import { fileSize } from '../utils/paths.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('pipeline')

type StageReporter = (percent: number) => void

/** Progress reporter pinned to a stage window; never moves backwards. */
function stageReporter(jobId: string, stage: JobStage, from: number, to: number): StageReporter {
  let last = from
  return (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent))
    last = Math.max(last, from + ((to - from) * clamped) / 100)
    updateJob(jobId, { stage, progress: Math.round(last) })
  }
}

/** Splits on the map's measured cut_points rather than on tube_duration_sec. */
async function splitAtCutPoints(
  inputPath: string,
  outputDir: string,
  cutPoints: number[],
  durationSec: number,
  onProgress: StageReporter,
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
      '-segment_times',
      cutPoints.join(','),
      '-segment_time_delta',
      '0.05',
      '-segment_format',
      'mp4',
      '-reset_timestamps',
      '1',
      path.join(outputDir, 'seg_%05d.mp4'),
    ],
    durationSec,
    onProgress,
  })

  const files = (await fsp.readdir(outputDir))
    .filter((name) => /^seg_\d+\.mp4$/.test(name))
    .sort()
    .map((name) => path.join(outputDir, name))

  if (files.length === 0) throw new Error('Restore produced no segments')
  return files
}

/**
 * Hash each media stream independently: remuxing can change cross-stream
 * packet interleaving even when every encoded audio/video packet is preserved.
 */
async function contentMd5(filePath: string, hasAudio: boolean, videoCodec: string): Promise<string | null> {
  try {
    const streams = ['0:v:0', ...(hasAudio ? ['0:a:0'] : [])]
    const hashes = await Promise.all(
      streams.map(async (stream) => {
        const args = [
          '-i',
          filePath,
          '-map',
          stream,
        ]
        if (stream === '0:v:0' && videoCodec === 'h264') {
          args.push('-c:v', 'copy', '-bsf:v', 'h264_mp4toannexb')
        } else if (stream === '0:v:0' && videoCodec === 'hevc') {
          args.push('-c:v', 'copy', '-bsf:v', 'hevc_mp4toannexb')
        } else {
          args.push('-c', 'copy')
        }
        args.push('-f', 'md5', '-')
        const stdout = await runFfmpegCapture(args)
        const hash = /^MD5=([0-9a-f]{32})$/im.exec(stdout.trim())?.[1]
        if (!hash) throw new Error(`FFmpeg returned no content hash for stream ${stream}`)
        return hash
      }),
    )
    return crypto.createHash('md5').update(hashes.join(':')).digest('hex')
  } catch (error) {
    log.warn('Failed to compute media content hash', { error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

export interface CompressPipelineInput {
  jobId: string
  inputPath: string
  originalName: string
  options: CompressOptions
}

export async function runCompressPipeline({ jobId, inputPath, originalName, options }: CompressPipelineInput): Promise<void> {
  const workDir = jobDir(jobId)
  const outDir = outputDir(jobId)
  await fsp.mkdir(workDir, { recursive: true })
  await fsp.mkdir(outDir, { recursive: true })

  const warnings: string[] = []

  // --- probe ---------------------------------------------------------------
  updateJob(jobId, { stage: 'probe', status: 'processing', progress: 1 })
  const meta: VideoMeta = await probe(inputPath)
  if (meta.durationSec <= 0) throw new ValidationError('Input has no measurable duration')
  if (meta.durationSec / Math.max(0.1, options.tubeDurationSec) > 5000) {
    warnings.push(
      `A ${options.tubeDurationSec}s tube duration would create over 5000 tubes for a ${meta.durationSec.toFixed(1)}s input.`,
    )
  }
  updateJob(jobId, { progress: 5 })

  // --- audio (extracted once, never segmented) ----------------------------
  const audio = await extractAudio(inputPath, workDir, meta.hasAudio)
  if (!meta.hasAudio) warnings.push('Input has no audio track; the output will be video-only.')

  const md5Original = await md5File(inputPath)
  setMd5(jobId, md5Original)
  await fsp.writeFile(path.join(outDir, 'md5_original.txt'), `${md5Original}\n`, 'utf8')

  // --- source video preparation -------------------------------------------
  let sourceVideo = inputPath
  if (options.mode === 'reencode') {
    await normalizeToCfr(
      inputPath,
      path.join(workDir, 'normalized.mp4'),
      config.targetFps,
      config.keyframeIntervalSec,
      meta.durationSec,
      stageReporter(jobId, 'encode', 6, 26),
    )
    sourceVideo = path.join(workDir, 'normalized.mp4')
  }

  // --- split ---------------------------------------------------------------
  const split = await splitAndMeasure(
    sourceVideo,
    workDir,
    options.tubeDurationSec,
    meta.durationSec,
    stageReporter(jobId, 'split', 27, 62),
  )
  const tubeCount = split.tubeFiles.length

  // --- shuffle -------------------------------------------------------------
  updateJob(jobId, { stage: 'shuffle', progress: 64 })
  const order = fisherYates(Array.from({ length: tubeCount }, (_, index) => index), options.shuffleSeed)
  if (order.every((value, index) => value === index)) {
    warnings.push(`Seed ${options.shuffleSeed} produced the identity order, so the tubes are not actually reordered.`)
  }

  // --- concat (stream copy) ------------------------------------------------
  updateJob(jobId, { stage: 'concat', progress: 66 })
  const shuffledVideo = path.join(workDir, 'shuffled_video.mp4')
  await concatTubes(split.tubeFiles, order, shuffledVideo, meta.durationSec, (percent) => {
    updateJob(jobId, { progress: Math.round(66 + (percent * 12) / 100) })
  })

  // --- encode (reencode only) ---------------------------------------------
  const compressedPath = path.join(outDir, 'compressed_video.mp4')
  const nominalCuts = shuffledBoundaries(split.tubeDurations, order)

  let cutPoints = nominalCuts
  if (options.mode === 'reencode') {
    await reencode(
      shuffledVideo,
      audio.audioPath,
      compressedPath,
      { codec: options.outputCodec, preset: options.preset, crf: options.crf },
      meta.durationSec,
      stageReporter(jobId, 'encode', 78, 94),
    )
  } else {
    await muxAudio(shuffledVideo, audio.audioPath, compressedPath, meta.durationSec, stageReporter(jobId, 'mux', 80, 94))
  }

  // Record measured keyframe timestamps from the final compressed file; these
  // remain valid even when remuxing or re-encoding changes packet timestamps.
  const maxBoundaryDriftSec = options.mode === 'reencode' ? 0.1 : 0.25
  cutPoints = matchCutPoints(nominalCuts, await findKeyframes(compressedPath), maxBoundaryDriftSec)
  const maxDrift = Math.max(0, ...cutPoints.map((value, index) => Math.abs(value - (nominalCuts[index] ?? 0))))
  if (maxDrift > 0.001) {
    warnings.push(
      `Measured tube boundaries differ from the requested boundaries by up to ${maxDrift.toFixed(2)}s; restoration uses the measured keyframes.`,
    )
  }
  const compressedDuration = await probeDuration(compressedPath)
  const originalContentMd5 = await contentMd5(inputPath, meta.hasAudio, meta.videoCodec)
  if (!originalContentMd5) {
    warnings.push('The original media content hash could not be computed; a later lossless integrity check may be unavailable.')
  }

  // --- map -----------------------------------------------------------------
  const tubeMap: TubeMap = buildTubeMap({
    mode: options.mode,
    tubeCount,
    tubeDurationSec: options.tubeDurationSec,
    shuffleSeed: options.shuffleSeed,
    cutPoints,
    compressedDurationSec: compressedDuration,
    original: {
      filename: originalName,
      size_bytes: await fileSize(inputPath),
      duration_sec: meta.durationSec,
      md5: md5Original,
      content_md5: originalContentMd5,
    },
    order,
  })

  const mapPath = path.join(outDir, 'tube_map.json')
  await fsp.writeFile(mapPath, `${JSON.stringify(tubeMap, null, 2)}\n`, 'utf8')

  // --- verify --------------------------------------------------------------
  updateJob(jobId, { stage: 'verify', progress: 96 })
  const [originalSize, compressedSize, tubeMapSize] = await Promise.all([
    fileSize(inputPath),
    fileSize(compressedPath),
    fileSize(mapPath),
  ])

  if (Math.abs(compressedDuration - meta.durationSec) > Math.max(1, meta.durationSec * 0.05)) {
    warnings.push(
      `Output duration ${compressedDuration.toFixed(2)}s differs from the input's ${meta.durationSec.toFixed(2)}s.`,
    )
  }

  const files: JobFileEntry[] = [
    { type: 'compressed', path: compressedPath, downloadName: 'compressed_video.mp4', contentType: 'video/mp4' },
    { type: 'map', path: mapPath, downloadName: 'tube_map.json', contentType: 'application/json' },
    {
      type: 'md5',
      path: path.join(outDir, 'md5_original.txt'),
      downloadName: 'md5_original.txt',
      contentType: 'text/plain',
    },
    { type: 'original', path: inputPath, downloadName: 'original_video.mp4', contentType: 'video/mp4' },
  ]
  registerFiles(jobId, files)
  for (const warning of warnings) addWarning(jobId, warning)

  updateJob(jobId, {
    stage: 'done',
    progress: 100,
    status: 'completed',
    result: {
      originalSize,
      compressedSize,
      tubeMapSize,
      restoredSize: null,
      compressionRatio: Number((compressedSize / originalSize).toFixed(4)),
      durationSec: meta.durationSec,
      tubeCount,
      mode: options.mode,
      lossless: options.mode === 'stream',
      md5Original,
      // Re-encoding is known to be lossy; stream-copy verification happens on restore.
      md5Match: options.mode === 'reencode' ? false : null,
      compressedVideoUrl: `/api/download/${jobId}/compressed`,
      tubeMapUrl: `/api/download/${jobId}/map`,
      restoredVideoUrl: null,
      md5FileUrl: `/api/download/${jobId}/md5`,
      originalVideoUrl: `/api/download/${jobId}/original`,
      warnings,
    },
  })

  log.info('Compression finished', {
    job_id: jobId,
    mode: options.mode,
    tube_count: tubeCount,
    ratio: Number((compressedSize / originalSize).toFixed(4)),
  })
}

export interface DecompressPipelineInput {
  jobId: string
  compressedPath: string
  mapPath: string
}

export async function runDecompressPipeline({ jobId, compressedPath, mapPath }: DecompressPipelineInput): Promise<void> {
  const workDir = jobDir(jobId)
  const outDir = outputDir(jobId)
  await fsp.mkdir(workDir, { recursive: true })
  await fsp.mkdir(outDir, { recursive: true })

  const warnings: string[] = []

  // --- validate map --------------------------------------------------------
  updateJob(jobId, { stage: 'probe', status: 'processing', progress: 2 })
  let parsedMap: TubeMap
  try {
    parsedMap = JSON.parse(await fsp.readFile(mapPath, 'utf8')) as TubeMap
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('tube_map.json is not valid JSON')
    }
    throw error
  }
  const { order, cutPoints } = planRestore(parsedMap)

  const meta = await probe(compressedPath)
  if (cutPoints.some((point) => point >= meta.durationSec)) {
    throw new ValidationError('tube_map.json contains a cut point outside the compressed video duration')
  }
  if (parsedMap.original?.duration_sec && Math.abs(meta.durationSec - parsedMap.original.duration_sec) > 2) {
    warnings.push(
      `Compressed duration ${meta.durationSec.toFixed(2)}s differs from the map's original ${parsedMap.original.duration_sec.toFixed(2)}s.`,
    )
  }
  log.info('Map validated', { job_id: jobId, tube_count: parsedMap.tube_count, mode: parsedMap.mode })

  // --- audio (never segmented) --------------------------------------------
  const audio = await extractAudio(compressedPath, workDir, meta.hasAudio)
  if (!meta.hasAudio) warnings.push('Compressed video has no audio track; audio cannot be restored.')

  // --- split on cut_points -------------------------------------------------
  const segments = await splitAtCutPoints(
    compressedPath,
    path.join(workDir, 'segments'),
    cutPoints,
    meta.durationSec,
    stageReporter(jobId, 'split', 8, 55),
  )
  if (segments.length !== parsedMap.tube_count) {
    throw new ValidationError(
      `The compressed video produced ${segments.length} segments but the tube map requires ${parsedMap.tube_count}; verify that the map belongs to this video.`,
    )
  }

  // --- restore order -------------------------------------------------------
  updateJob(jobId, { stage: 'restore', progress: 56 })
  const restoredVideo = path.join(workDir, 'restored_video.mp4')
  await concatTubes(segments, order, restoredVideo, meta.durationSec, stageReporter(jobId, 'concat', 56, 78))

  const restoredPath = path.join(outDir, 'restored_video.mp4')
  await muxAudio(restoredVideo, audio.audioPath, restoredPath, meta.durationSec, stageReporter(jobId, 'mux', 79, 90))

  // --- verify --------------------------------------------------------------
  updateJob(jobId, { stage: 'verify', progress: 92 })
  const restoredSize = await fileSize(restoredPath)
  const lossless = parsedMap.mode === 'stream'

  let md5Match: boolean | null = null
  if (lossless) {
    const expected = parsedMap.original?.content_md5 ?? null
    const actual = await contentMd5(restoredPath, meta.hasAudio, meta.videoCodec)
    if (expected && actual) md5Match = expected === actual
    else warnings.push('The map carries no content hash, so the lossless check could not be performed.')
  } else {
    md5Match = false
    warnings.push('This map came from a re-encoded (lossy) file, so restored frames are not identical to the original.')
  }

  registerFiles(jobId, [
    { type: 'restored', path: restoredPath, downloadName: 'restored_video.mp4', contentType: 'video/mp4' },
    { type: 'compressed', path: compressedPath, downloadName: 'compressed_video.mp4', contentType: 'video/mp4' },
    { type: 'map', path: mapPath, downloadName: 'tube_map.json', contentType: 'application/json' },
  ])
  for (const warning of warnings) addWarning(jobId, warning)

  const [compressedSize, tubeMapSize] = await Promise.all([fileSize(compressedPath), fileSize(mapPath)])
  const originalSize = parsedMap.original?.size_bytes ?? 0

  updateJob(jobId, {
    stage: 'done',
    progress: 100,
    status: 'completed',
    result: {
      originalSize,
      compressedSize,
      tubeMapSize,
      restoredSize,
      compressionRatio: originalSize ? Number((originalSize / restoredSize).toFixed(4)) : 1,
      durationSec: meta.durationSec,
      tubeCount: parsedMap.tube_count,
      mode: parsedMap.mode,
      lossless,
      md5Original: parsedMap.original?.md5 ?? '',
      md5Match,
      compressedVideoUrl: `/api/download/${jobId}/compressed`,
      tubeMapUrl: `/api/download/${jobId}/map`,
      restoredVideoUrl: `/api/download/${jobId}/restored`,
      md5FileUrl: null,
      originalVideoUrl: null,
      warnings,
    },
  })

  log.info('Decompression finished', { job_id: jobId, tube_count: parsedMap.tube_count, md5_match: md5Match })
}
