import { formatFileSize } from './formatters.js'
import { MAX_MAP_SIZE, MAX_UPLOAD_SIZE } from './constants.js'

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]

export const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv']

export const MAX_VIDEO_SIZE = MAX_UPLOAD_SIZE

export function validateVideoFile(file) {
  if (!file) return 'No file provided'

  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Accepted: MP4, MOV, AVI, MKV`
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return `File too large: ${formatFileSize(file.size)}. Maximum: ${formatFileSize(MAX_VIDEO_SIZE)}`
  }

  return null
}

export function validateMapFile(file) {
  if (!file) return 'No map file provided'

  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    return 'Please upload a JSON file (.json)'
  }

  if (file.size > MAX_MAP_SIZE) {
    return `Map file too large: ${formatFileSize(file.size)}. Maximum: ${formatFileSize(MAX_MAP_SIZE)}`
  }

  return null
}

export function validateTubeMap(map) {
  if (!map || typeof map !== 'object') return 'Invalid tube map: not an object'

  if (!map.version) return 'Invalid tube map: missing version'
  if (!map.tube_count || typeof map.tube_count !== 'number') return 'Invalid tube map: missing tube_count'
  if (!map.tubes || !Array.isArray(map.tubes)) return 'Invalid tube map: missing tubes array'

  for (let i = 0; i < map.tubes.length; i++) {
    const tube = map.tubes[i]
    if (typeof tube.tube_id !== 'number') return `Tube ${i}: missing tube_id`
    if (typeof tube.original_index !== 'number') return `Tube ${i}: missing original_index`
    if (typeof tube.shuffled_index !== 'number') return `Tube ${i}: missing shuffled_index`
  }

  return null
}

export function sanitizeFilename(filename) {
  return filename
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255)
}

export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}