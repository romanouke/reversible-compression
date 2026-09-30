import { isPermutation } from './tubeShuffler.js'
import type { TubeMap } from '../types/job.js'
import { ValidationError } from '../utils/validate.js'

export interface RestoredOrder {
  /** Tube indexes in the compressed file, ordered by their original position. */
  order: number[]
  cutPoints: number[]
}

/** Validates the map and derives the concatenation order for restoration. */
export function planRestore(map: TubeMap): RestoredOrder {
  if (!map || typeof map !== 'object') {
    throw new ValidationError('tube_map.json is not a valid object')
  }
  if (map.version !== 1) {
    throw new ValidationError('tube_map.json has an unsupported version')
  }
  if (!Array.isArray(map.tubes) || map.tubes.length === 0) {
    throw new ValidationError('tube_map.json has no tubes')
  }
  if (!Number.isInteger(map.tube_count) || map.tube_count <= 0) {
    throw new ValidationError('tube_map.json has an invalid tube_count')
  }
  if (!Number.isFinite(map.tube_duration_sec) || map.tube_duration_sec < 0.1 || map.tube_duration_sec > 60) {
    throw new ValidationError('tube_map.json has an invalid tube_duration_sec')
  }
  if (!Number.isInteger(map.shuffle_seed) || map.shuffle_seed < 0 || map.shuffle_seed > 2147483647) {
    throw new ValidationError('tube_map.json has an invalid shuffle_seed')
  }
  if (!map.original || typeof map.original !== 'object' || Array.isArray(map.original)) {
    throw new ValidationError('tube_map.json has no original video metadata')
  }
  if (
    typeof map.original.filename !== 'string' ||
    !Number.isFinite(map.original.size_bytes) ||
    map.original.size_bytes < 0 ||
    !Number.isFinite(map.original.duration_sec) ||
    map.original.duration_sec <= 0 ||
    !/^[a-f\d]{32}$/i.test(map.original.md5) ||
    (map.original.content_md5 !== null && !/^[a-f\d]{32}$/i.test(map.original.content_md5))
  ) {
    throw new ValidationError('tube_map.json contains invalid original video metadata')
  }
  if (map.tubes.length !== map.tube_count) {
    throw new ValidationError(`tube_count (${map.tube_count}) does not match tubes[] length (${map.tubes.length})`)
  }
  if (!Array.isArray(map.cut_points) || map.cut_points.length !== map.tube_count - 1) {
    throw new ValidationError(
      `cut_points must contain ${map.tube_count - 1} entries, got ${Array.isArray(map.cut_points) ? map.cut_points.length : 0}`,
    )
  }
  if (map.cut_points.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new ValidationError('tube_map.json contains invalid cut_points values')
  }
  for (let i = 1; i < map.cut_points.length; i += 1) {
    if ((map.cut_points[i] as number) <= (map.cut_points[i - 1] as number)) {
      throw new ValidationError('tube_map.json cut_points must be strictly increasing')
    }
  }
  if (map.mode !== 'stream' && map.mode !== 'reencode') {
    throw new ValidationError('tube_map.json has an unknown mode')
  }

  if (map.tubes.some((tube) => !tube || typeof tube !== 'object' || Array.isArray(tube))) {
    throw new ValidationError('tube_map.json contains an invalid tube entry')
  }

  const sortedByShuffled = [...map.tubes].sort((a, b) => a.shuffled_index - b.shuffled_index)
  if (sortedByShuffled.some((tube, index) => tube.shuffled_index !== index)) {
    throw new ValidationError('tube_map.json shuffled_index values must cover 0..n-1 exactly once')
  }

  // Concat order: walk original positions 0..n-1 and pick the tube that was
  // shuffled into that position.
  const order = new Array<number>(map.tube_count)
  for (const tube of sortedByShuffled) {
    if (!Number.isInteger(tube.tube_id) || tube.tube_id !== tube.shuffled_index) {
      throw new ValidationError('tube_map.json tube_id values must match shuffled_index')
    }
    if (!Number.isInteger(tube.original_index) || tube.original_index < 0 || tube.original_index >= map.tube_count) {
      throw new ValidationError('tube_map.json contains an out-of-range original_index')
    }
    const expectedStart = tube.shuffled_index === 0 ? 0 : map.cut_points[tube.shuffled_index - 1]
    const expectedEnd = tube.shuffled_index === map.tube_count - 1
      ? tube.end_sec
      : map.cut_points[tube.shuffled_index]
    if (
      !Number.isFinite(tube.start_sec) ||
      !Number.isFinite(tube.end_sec) ||
      Math.abs(tube.start_sec - (expectedStart ?? 0)) > 0.001 ||
      Math.abs(tube.end_sec - (expectedEnd ?? 0)) > 0.001 ||
      tube.end_sec <= tube.start_sec
    ) {
      throw new ValidationError('tube_map.json tube time ranges do not match its cut_points')
    }
    order[tube.original_index] = tube.shuffled_index
  }

  if (!isPermutation(order)) {
    throw new ValidationError('tube_map.json does not describe a valid permutation')
  }

  return { order, cutPoints: [...map.cut_points] }
}

/** True when the map was produced by the lossless stream-copy mode. */
export function isLosslessMap(map: TubeMap): boolean {
  return map.mode === 'stream'
}
