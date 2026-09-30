import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { runFfmpegCapture } from '../src/core/ffmpeg.js'
import { ffprobePath, probe } from '../src/core/ffprobe.js'

const execFileAsync = promisify(execFile)
const dir = 'C:/Users/romam/AppData/Local/Temp/kilo/revc5'
const src = `${dir}/src.mp4`

async function packets(file: string) {
  const { stdout } = await execFileAsync(
    ffprobePath(),
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time,dts_time,flags', '-print_format', 'json', file],
    { maxBuffer: 64 * 1024 * 1024 },
  )
  const parsed = JSON.parse(stdout) as { packets?: Array<{ pts_time?: string; flags?: string }> }
  return (parsed.packets ?? []).filter((p) => String(p.flags).includes('K')).map((p) => Number(p.pts_time))
}

console.log('meta', await probe(src))
console.log('keyframe packets', await packets(src))

const { stdout: streamJson } = await execFileAsync(ffprobePath(), ['-v', 'error', '-select_streams', 'v:0', '-show_streams', '-print_format', 'json', src])
console.log('stream', JSON.parse(stdout).streams[0])

const cut = await runFfmpegCapture(['-i', src, '-map', '0:v:0', '-c', 'copy', '-f', 'null', '-'])
console.log('decode ok')
