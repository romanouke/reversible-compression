export const APP_NAME = 'Reversible Compression'
export const APP_VERSION = '1.0.0'

export const API_ENDPOINTS = {
  COMPRESS: '/api/compress',
  DECOMPRESS: '/api/decompress',
  STATUS: '/api/status',
  WS: '/api/ws',
  DOWNLOAD: '/api/download',
  HEALTH: '/health',
}

export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export const JOB_STAGES = {
  SPLIT: 'split',
  SHUFFLE: 'shuffle',
  ENCODE: 'encode',
  RESTORE: 'restore',
  CONCAT: 'concat',
  MUX: 'mux',
  VERIFY: 'verify',
}

export const JOB_TYPES = {
  COMPRESS: 'compress',
  DECOMPRESS: 'decompress',
}

export const DEFAULT_CONFIG = {
  // stream keeps every packet untouched (lossless, size ~unchanged);
  // reencode shrinks the file at the cost of exact restoration.
  mode: 'stream',
  tubeDurationSec: 1.0,
  shuffleSeed: 42,
  outputCodec: 'libx264',
  preset: 'medium',
  crf: 23,
}

export const MODE_OPTIONS = [
  { value: 'stream', label: 'Stream copy (lossless, size unchanged)' },
  { value: 'reencode', label: 'Re-encode (smaller file, not lossless)' },
]

export const CODEC_OPTIONS = [
  { value: 'libx264', label: 'H.264 (libx264)' },
  { value: 'libx265', label: 'HEVC/H.265 (libx265)' },
  { value: 'libvpx-vp9', label: 'VP9 (libvpx-vp9)' },
  { value: 'mpeg4', label: 'MPEG-4 (mpeg4)' },
]

export const PRESET_OPTIONS = [
  { value: 'ultrafast', label: 'Ultrafast (fastest, larger file)' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Veryfast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium (default)' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Veryslow (slowest, smallest file)' },
]

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
]

export const LOG_LEVELS = [
  { value: 'DEBUG', label: 'Debug' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'ERROR', label: 'Error' },
]

function maxSizeBytes(envName, fallbackMb) {
  const configuredMb = Number(import.meta.env[envName])
  const sizeMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : fallbackMb
  return sizeMb * 1024 * 1024
}

export const MAX_UPLOAD_SIZE = maxSizeBytes('VITE_MAX_UPLOAD_MB', 500)
export const MAX_MAP_SIZE = maxSizeBytes('VITE_MAX_MAP_MB', 10)

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]

export const STORAGE_KEYS = {
  THEME: 'revcomp-theme',
  SETTINGS: 'revcomp-settings',
  HISTORY: 'revcomp-history',
}

export const POLL_INTERVAL = 1000 // ms
export const WS_RECONNECT_INTERVAL = 3000 // ms