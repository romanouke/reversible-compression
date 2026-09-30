import fsp from 'node:fs/promises'

export const ACCEPTED_VIDEO_MIME = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'application/octet-stream', // browsers frequently send this for .mkv/.mov
] as const

export const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'] as const

export class ValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/** Container signatures. Extension and MIME alone are trivially spoofed. */
function detectContainer(head: Buffer): 'mp4' | 'matroska' | 'avi' | 'unknown' {
  if (head.length >= 12) {
    const boxType = head.subarray(4, 8).toString('latin1')
    if (boxType === 'ftyp') return 'mp4'
    if (head.readUInt32BE(0) === 0x1a45dfa3) return 'matroska'
    if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'AVI ') {
      return 'avi'
    }
  }
  return 'unknown'
}

export function isVideoExtension(filename: string): boolean {
  const lower = filename.toLowerCase()
  return ACCEPTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export async function assertLooksLikeVideo(filePath: string, filename: string, mimeType: string): Promise<void> {
  if (!isVideoExtension(filename)) {
    throw new ValidationError(`Unsupported file extension for "${filename}". Allowed: ${ACCEPTED_VIDEO_EXTENSIONS.join(', ')}`)
  }
  if (mimeType && !ACCEPTED_VIDEO_MIME.includes(mimeType as (typeof ACCEPTED_VIDEO_MIME)[number])) {
    throw new ValidationError(`Unsupported MIME type "${mimeType}".`)
  }

  const handle = await fsp.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(64)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    const container = detectContainer(buffer.subarray(0, bytesRead))
    if (container === 'unknown') {
      throw new ValidationError('File signature does not match a known video container (mp4/matroska/avi).')
    }
  } finally {
    await handle.close()
  }
}

export function sanitizeFilename(input: string): string {
  // Normalise unicode, drop directory components and control characters.
  const base = input.normalize('NFKC').split(/[\\/]/).pop() ?? 'upload'
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\.\./g, '')
    .trim()
  const safe = cleaned.length > 0 ? cleaned : 'upload'
  return safe.slice(0, 255)
}

export function parseFiniteNumber(raw: unknown, field: string): number {
  const value = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim())
  if (!Number.isFinite(value)) {
    throw new ValidationError(`"${field}" must be a number`)
  }
  return value
}

export function parseSeed(raw: unknown, fallback: number): number {
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback
  const seed = Number(String(raw).trim())
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) {
    throw new ValidationError('"shuffle_seed" must be an integer between 0 and 2147483647')
  }
  return seed
}

export function parseMode(raw: unknown, fallback: 'stream' | 'reencode'): 'stream' | 'reencode' {
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback
  const mode = String(raw).trim()
  if (mode !== 'stream' && mode !== 'reencode') {
    throw new ValidationError('"mode" must be "stream" or "reencode"')
  }
  return mode
}

export function parsePreset(raw: unknown, fallback: string): string {
  const value = raw === undefined || raw === null || String(raw).trim() === '' ? fallback : String(raw).trim()
  if (!/^[a-z0-9_-]{1,32}$/i.test(value)) {
    throw new ValidationError('"preset" contains unsupported characters')
  }
  return value
}

export function parseCrf(raw: unknown, fallback: number): number {
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback
  const crf = Number(String(raw).trim())
  if (!Number.isInteger(crf) || crf < 0 || crf > 51) {
    throw new ValidationError('"crf" must be an integer between 0 and 51')
  }
  return crf
}

const ALLOWED_CODECS = new Set([
  'libx264',
  'libx265',
  'libvpx-vp9',
  'mpeg4',
  'libaom-av1',
  'h264_nvenc',
  'h264_vaapi',
  'h264_qsv',
])

export function parseCodec(raw: unknown, fallback: string): string {
  const value = raw === undefined || raw === null || String(raw).trim() === '' ? fallback : String(raw).trim()
  if (!ALLOWED_CODECS.has(value)) {
    throw new ValidationError(`"output_codec" must be one of ${[...ALLOWED_CODECS].join(', ')}`)
  }
  return value
}
