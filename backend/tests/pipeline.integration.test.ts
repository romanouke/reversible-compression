import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { ffmpegPath, runFfmpegCapture } from '../src/core/ffmpeg.js'
import { findKeyframes, probe } from '../src/core/ffprobe.js'
import { runCompressPipeline } from '../src/jobs/pipelines.js'
import { runDecompressPipeline } from '../src/jobs/pipelines.js'
import { createJob, getJob } from '../src/jobs/store.js'
import type { CompressOptions, TubeMap } from '../src/types/job.js'

/**
 * Integration test: encodes a synthetic 6s clip, then runs the real pipelines
 * over the bundled FFmpeg. Fixtures are generated rather than committed.
 */
let workRoot = ''
let sourceVideo = ''

async function makeFixture(dir: string): Promise<string> {
  const output = path.join(dir, 'sample_360p.mp4')
  await runFfmpegCapture([
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=640x360:rate=30:duration=6',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000:duration=6',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-g',
    '60',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    '-t',
    '6',
    output,
  ])
  return output
}

function options(overrides: Partial<CompressOptions> = {}): CompressOptions {
  return {
    mode: 'stream',
    tubeDurationSec: 2,
    shuffleSeed: 42,
    outputCodec: 'libx264',
    preset: 'veryfast',
    crf: 28,
    ...overrides,
  }
}

beforeAll(async () => {
  workRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'revcomp-it-'))
  sourceVideo = await makeFixture(workRoot)

  const meta = await probe(sourceVideo)
  if (meta.durationSec <= 0) throw new Error('fixture has no duration')
})

afterAll(async () => {
  if (workRoot) await fsp.rm(workRoot, { recursive: true, force: true })
})

describe('pipeline integration', () => {
  it('produces a source fixture with keyframes', async () => {
    expect(ffmpegPath()).toBeTruthy()
    const keyframes = await findKeyframes(sourceVideo)
    expect(keyframes.length).toBeGreaterThanOrEqual(2)
  })

  it('round-trips losslessly in stream mode', async () => {
    const job = createJob('compress', options())
    const input = path.join(workRoot, 'upload_stream.mp4')
    await fsp.copyFile(sourceVideo, input)

    await runCompressPipeline({ jobId: job.id, inputPath: input, originalName: 'sample_360p.mp4', options: options() })

    const compressJob = getJob(job.id)
    expect(compressJob?.status).toBe('completed')
    expect(compressJob?.result?.lossless).toBe(true)
    expect(compressJob?.result?.md5Match).toBeNull()
    expect(compressJob?.result?.tubeCount).toBeGreaterThan(1)
    // Stream copy reorders packets; it is not supposed to shrink the file.
    expect(compressJob?.result?.compressionRatio).toBeGreaterThan(0.5)
    expect(compressJob?.result?.compressionRatio).toBeLessThan(2)

    const outDir = path.join(process.cwd(), 'storage', 'output', job.id)
    const map = JSON.parse(await fsp.readFile(path.join(outDir, 'tube_map.json'), 'utf8')) as TubeMap
    expect(map.mode).toBe('stream')
    expect(map.tubes).toHaveLength(map.tube_count)
    expect(map.cut_points).toHaveLength(map.tube_count - 1)
    expect(map.original.content_md5).toMatch(/^[0-9a-f]{32}$/)

    const restoreJob = createJob('decompress', null)
    await runDecompressPipeline({
      jobId: restoreJob.id,
      compressedPath: path.join(outDir, 'compressed_video.mp4'),
      mapPath: path.join(outDir, 'tube_map.json'),
    })

    const restored = getJob(restoreJob.id)
    expect(restored?.status).toBe('completed')
    expect(restored?.result?.lossless).toBe(true)
    expect(restored?.result?.md5Match).toBe(true)
    expect(restored?.result?.restoredSize).toBeGreaterThan(0)
  })

  it('reports reencode as lossy with a ratio below 1', async () => {
    const job = createJob('compress', options({ mode: 'reencode', crf: 40 }))
    const input = path.join(workRoot, 'upload_reencode.mp4')
    await fsp.copyFile(sourceVideo, input)

    await runCompressPipeline({
      jobId: job.id,
      inputPath: input,
      originalName: 'sample_360p.mp4',
      options: options({ mode: 'reencode', crf: 40 }),
    })

    const compressJob = getJob(job.id)
    expect(compressJob?.status).toBe('completed')
    expect(compressJob?.result?.lossless).toBe(false)
    expect(compressJob?.result?.md5Match).toBe(false)
    expect(compressJob?.result?.compressionRatio).toBeLessThan(1)

    const outDir = path.join(process.cwd(), 'storage', 'output', job.id)
    const map = JSON.parse(await fsp.readFile(path.join(outDir, 'tube_map.json'), 'utf8')) as TubeMap
    // Re-measured on the encoded file, so still one entry fewer than the tubes.
    expect(map.cut_points).toHaveLength(map.tube_count - 1)
    for (let i = 1; i < map.cut_points.length; i += 1) {
      expect(map.cut_points[i] as number).toBeGreaterThan(map.cut_points[i - 1] as number)
    }

    const restoreJob = createJob('decompress', null)
    await runDecompressPipeline({
      jobId: restoreJob.id,
      compressedPath: path.join(outDir, 'compressed_video.mp4'),
      mapPath: path.join(outDir, 'tube_map.json'),
    })

    const restored = getJob(restoreJob.id)
    expect(restored?.status).toBe('completed')
    // A lossy pipeline must never claim a lossless verification.
    expect(restored?.result?.lossless).toBe(false)
    expect(restored?.result?.md5Match).toBe(false)
  })
})
