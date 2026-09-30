export type JobStage =
  | 'queued'
  | 'probe'
  | 'split'
  | 'shuffle'
  | 'encode'
  | 'restore'
  | 'concat'
  | 'mux'
  | 'verify'
  | 'done'

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type JobType = 'compress' | 'decompress'

/** Files a job can expose for download. Maps 1:1 to the allowlist in routes/download.ts. */
export type JobFileType = 'compressed' | 'map' | 'restored' | 'md5' | 'original'

export interface CompressOptions {
  mode: 'stream' | 'reencode'
  tubeDurationSec: number
  shuffleSeed: number
  outputCodec: string
  preset: string
  crf: number
}

export interface VideoMeta {
  durationSec: number
  width: number
  height: number
  fps: number
  videoCodec: string
  audioCodec: string | null
  hasAudio: boolean
  sizeBytes: number
}

/** camelCase on purpose: this shape is serialised straight into HTTP responses. */
export interface JobResult {
  originalSize: number
  compressedSize: number
  tubeMapSize: number
  restoredSize: number | null
  compressionRatio: number
  durationSec: number
  tubeCount: number
  mode: 'stream' | 'reencode'
  lossless: boolean
  md5Original: string
  md5Match: boolean | null
  compressedVideoUrl: string | null
  tubeMapUrl: string | null
  restoredVideoUrl: string | null
  md5FileUrl: string | null
  originalVideoUrl: string | null
  warnings: string[]
}

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: number
  stage: JobStage
  createdAt: string
  updatedAt: string
  finishedAt: string | null
  options: CompressOptions | null
  result: JobResult | null
  error: string | null
  warnings: string[]
}

export interface JobFileEntry {
  type: JobFileType
  path: string
  downloadName: string
  contentType: string
}

export interface JobFiles {
  files: JobFileEntry[]
}

export interface StoredJobSnapshot {
  job: Job
  files: JobFileEntry[]
  options: CompressOptions | null
  md5Original: string | null
  /** Present only for compress jobs that finished; used by the restore path. */
  tubeMapPath: string | null
  sourceDurationSec: number | null
}

export interface TubeEntry {
  tube_id: number
  original_index: number
  shuffled_index: number
  start_sec: number
  end_sec: number
}

export interface TubeMap {
  version: number
  mode: 'stream' | 'reencode'
  tube_count: number
  tube_duration_sec: number
  shuffle_seed: number
  /** Measured keyframe boundaries of the compressed file, in seconds. */
  cut_points: number[]
  created_at: string
  original: {
    filename: string
    size_bytes: number
    duration_sec: number
    /** Whole-file md5 of the uploaded original. */
    md5: string
    /** Combined per-stream packet hashes for the first video/audio tracks. */
    content_md5: string | null
  }
  tubes: TubeEntry[]
}
