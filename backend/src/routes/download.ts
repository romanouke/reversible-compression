import { createReadStream, promises as fsp } from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { config } from '../config.js'
import { getFile, requireJob } from '../jobs/store.js'
import { HttpError } from '../middleware/errors.js'
import type { JobFileType } from '../types/job.js'

const router = Router()

/**
 * Allowlist, not user input: only these five keys can ever be resolved, and the
 * stored paths were built by the server from job ids and fixed file names.
 */
const FILE_TYPES: JobFileType[] = ['compressed', 'map', 'restored', 'md5', 'original']

function isFileType(value: string): value is JobFileType {
  return (FILE_TYPES as string[]).includes(value)
}

router.get('/:job_id/:file_type', async (req, res, next) => {
  try {
    const { job_id: jobId, file_type: rawType } = req.params
    if (!jobId || !rawType || !isFileType(rawType)) {
      next(new HttpError(400, `file_type must be one of ${FILE_TYPES.join(', ')}`))
      return
    }

    const job = requireJob(jobId)
    const entry = getFile(job.id, rawType)
    if (!entry) {
      next(new HttpError(404, `No "${rawType}" file is available for job ${job.id}`))
      return
    }

    // Defensive re-check: the registry entry must still live under storage.
    const storageRoot = path.resolve(config.paths.storage)
    const resolved = path.resolve(entry.path)
    if (resolved !== storageRoot && !resolved.startsWith(storageRoot + path.sep)) {
      next(new HttpError(400, 'Resolved file path is outside the storage volume'))
      return
    }

    const stat = await fsp.stat(resolved).catch(() => null)
    if (!stat?.isFile()) {
      next(new HttpError(404, 'The file is no longer available; it may have been cleaned up by TTL'))
      return
    }

    res.setHeader('Content-Type', entry.contentType)
    res.setHeader('Content-Length', String(stat.size))
    res.setHeader('Content-Disposition', `attachment; filename="${entry.downloadName}"`)
    res.setHeader('Cache-Control', 'private, max-age=0, no-store')

    createReadStream(resolved).on('error', next).pipe(res)
  } catch (error) {
    next(error)
  }
})

export default router
