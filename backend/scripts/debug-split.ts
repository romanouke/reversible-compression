import fsp from 'node:fs/promises'
import path from 'node:path'
import { runFfmpegCapture } from '../src/core/ffmpeg.js'
import { runFfmpeg } from '../src/core/ffmpeg.js'
import { findKeyframes as fk, probeDuration } from '../src/core/ffprobe.js'

const dir = 'C:/Users/romam/AppData/Local/Temp/kilo/revc6'
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
console.log('kf', (await fk(src)).map((k) => k.timeSec))

async function attempt(label: string, args: string[]) {
  const outDir = `${dir}/${label}`
  await fsp.mkdir(outDir, { recursive: true })
  try {
    await runFfmpeg({ args: ['-i', src, '-map', '0:v:0', '-c', 'copy', '-f', 'segment', '-segment_format', 'mp4', ...args, `${outDir}/seg_%05d.mp4`] })
    const files = (await fsp.readdir(outDir)).sort()
    const durations = await Promise.all(files.map((f) => probeDuration(path.join(outDir, f))))
    console.log(label.padEnd(28), 'count', files.length, durations.map((d) => Number(d.toFixed(3))))
  } catch (error) {
    console.log(label.padEnd(28), 'FAILED')
  }
}

for (const delta of ['0', '0.001', '0.01', '0.02', '0.04', '0.1', '0.5']) {
  await attempt(`st_delta_${delta}`, ['-segment_time', '2', '-segment_time_delta', delta, '-reset_timestamps', '1'])
}
await attempt('st_times_nudge_below', ['-segment_times', '1.99,3.99', '-reset_timestamps', '1'])
await attempt('st_times_delta0', ['-segment_times', '2,4', '-segment_time_delta', '0', '-reset_timestamps', '1'])
