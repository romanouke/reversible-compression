import fsp from 'node:fs/promises'
import path from 'node:path'
import { runFfmpeg, runFfmpegCapture } from '../src/core/ffmpeg.js'
import { findKeyframes, probe, probeDuration } from '../src/core/ffprobe.js'
import { extractAudio, muxAudio } from '../src/core/audioHandler.js'
import { splitAndMeasure, shuffledBoundaries, concatTubes, buildTubeMap } from '../src/core/tubeSplitter.js'
import { fisherYates } from '../src/core/tubeShuffler.js'

const dir = 'C:/Users/romam/AppData/Local/Temp/kilo/revc2'
await fsp.rm(dir, { recursive: true, force: true })
await fsp.mkdir(dir, { recursive: true })
const src = `${dir}/src.mp4`
await runFfmpegCapture([
  '-y',
  '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=6',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=6',
  '-c:v', 'libx264', '-preset', 'veryfast', '-g', '60', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '128k', '-t', '6', src,
])

const meta = await probe(src)
console.log('duration', meta.durationSec)
console.log('kf', (await findKeyframes(src)).map((k) => k.timeSec))

const split = await splitAndMeasure(src, dir, 2, meta.durationSec)
console.log('tubeCount', split.tubeFiles.length)
console.log('durations', split.tubeDurations)
console.log('files', split.tubeFiles.map((f) => path.basename(f)))

const order = fisherYates(Array.from({ length: split.tubeFiles.length }, (_, i) => i), 42)
console.log('order', order)
const cuts = shuffledBoundaries(split.tubeDurations, order)
console.log('cuts', cuts)

const audio = await extractAudio(src, dir, meta.hasAudio)
await concatTubes(split.tubeFiles, order, `${dir}/shuffled.mp4`, meta.durationSec)
await muxAudio(`${dir}/shuffled.mp4`, audio.audioPath, `${dir}/compressed.mp4`, meta.durationSec)
console.log('compressed duration', await probeDuration(`${dir}/compressed.mp4`))
console.log('compressed kf', (await findKeyframes(`${dir}/compressed.mp4`)).map((k) => k.timeSec))

const segDir = `${dir}/segments`
await runFfmpeg({
  args: [
    '-i', `${dir}/compressed.mp4`, '-map', '0:v:0', '-c', 'copy', '-f', 'segment',
    '-segment_times', cuts.join(','), '-segment_format', 'mp4', '-reset_timestamps', '1',
    `${segDir}/seg_%05d.mp4`,
  ],
  durationSec: meta.durationSec,
})
const segs = (await fsp.readdir(segDir)).sort()
console.log('segments', segs.length, segs)

buildTubeMap({
  mode: 'stream',
  tubeCount: split.tubeFiles.length,
  tubeDurationSec: 2,
  shuffleSeed: 42,
  cutPoints: cuts,
  original: { filename: 'src.mp4', size_bytes: 1, duration_sec: meta.durationSec, md5: 'x', content_md5: null },
  order,
})
console.log('map ok')
