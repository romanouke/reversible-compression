import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import { config } from '../config.js'
import { storedUploadName } from '../jobs/cleanup.js'
import { ValidationError } from '../utils/validate.js'

/**
 * Multer writes to storage/input under a `pending_*` name first: the final name
 * embeds the job id, which only exists once the job has been created. The route
 * renames the file afterwards via claimUpload().
 */
function makeStorage() {
  return multer.diskStorage({
    destination: config.paths.input,
    filename: (_req, file, cb) => {
      const unique = Math.random().toString(36).slice(2)
      cb(null, `pending_${Date.now()}_${unique}_${path.basename(file.originalname)}`)
    },
  })
}

const VIDEO_EXTENSION = /\.(mp4|mov|avi|mkv|m4v|webm)$/i

/** Compressed video and tube map arrive in one multipart body, so both fields
 * are declared up front: multer would otherwise reject tube_map as unexpected. */
export const uploadDecompress = multer({
  storage: makeStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 2, fields: 10 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'tube_map') {
      const lower = file.originalname.toLowerCase()
      if (!lower.endsWith('.json') && file.mimetype !== 'application/json') {
        cb(new ValidationError('The tube map must be a .json file'))
        return
      }
      cb(null, true)
      return
    }
    if (file.fieldname !== 'compressed_video') {
      cb(new ValidationError(`Unexpected file field "${file.fieldname}"`))
      return
    }
    fileFilter(_req, file, cb)
  },
}).fields([
  { name: 'compressed_video', maxCount: 1 },
  { name: 'tube_map', maxCount: 1 },
])

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Extension and MIME only; the magic-byte check runs once the file is on disk.
  if (!VIDEO_EXTENSION.test(file.originalname)) {
    cb(
      new ValidationError(
        `Unsupported file extension for "${file.originalname}". Allowed: ${['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'].join(', ')}`,
      ),
    )
    return
  }
  cb(null, true)
}

export const uploadVideo = multer({
  storage: makeStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter,
})

export function ensureInputDir(): void {
  fs.mkdirSync(config.paths.input, { recursive: true })
}

/** Moves an uploaded temp file to its `{job_id}__{name}` final location. */
export async function claimUpload(jobId: string, tempPath: string, originalName: string): Promise<string> {
  ensureInputDir()
  const target = path.join(config.paths.input, storedUploadName(jobId, originalName))
  await fsp.rename(tempPath, target)
  return target
}

export async function discardUpload(file: Express.Multer.File | undefined): Promise<void> {
  if (!file?.path) return
  await fsp.rm(file.path, { force: true }).catch(() => undefined)
}
