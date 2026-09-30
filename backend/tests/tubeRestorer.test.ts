import { describe, expect, it } from 'vitest'
import { planRestore } from '../src/core/tubeRestorer.js'
import { buildTubeMap } from '../src/core/tubeSplitter.js'
import type { TubeMap } from '../src/types/job.js'

function makeMap(overrides: Partial<TubeMap> = {}): TubeMap {
  return {
    version: 1,
    mode: 'stream',
    tube_count: 4,
    tube_duration_sec: 1,
    shuffle_seed: 42,
    cut_points: [1, 2, 3],
    created_at: '2026-01-01T00:00:00.000Z',
    original: { filename: 'a.mp4', size_bytes: 100, duration_sec: 4, md5: 'd41d8cd98f00b204e9800998ecf8427e', content_md5: null },
    tubes: [
      { tube_id: 0, original_index: 2, shuffled_index: 0, start_sec: 0, end_sec: 1 },
      { tube_id: 1, original_index: 0, shuffled_index: 1, start_sec: 1, end_sec: 2 },
      { tube_id: 2, original_index: 3, shuffled_index: 2, start_sec: 2, end_sec: 3 },
      { tube_id: 3, original_index: 1, shuffled_index: 3, start_sec: 3, end_sec: 4 },
    ],
    ...overrides,
  }
}

describe('planRestore', () => {
  it('inverts the shuffle order', () => {
    // Shuffled order was [2, 0, 3, 1], so restoring must concat [1, 3, 0, 2].
    expect(planRestore(makeMap()).order).toEqual([1, 3, 0, 2])
  })

  it('returns the recorded cut points', () => {
    expect(planRestore(makeMap()).cutPoints).toEqual([1, 2, 3])
  })

  it('rejects a cut_points/tube_count mismatch', () => {
    expect(() => planRestore(makeMap({ cut_points: [1, 2] }))).toThrow(/cut_points/)
  })

  it('rejects non-increasing cut points', () => {
    expect(() => planRestore(makeMap({ cut_points: [2, 1, 3] }))).toThrow(/increasing/)
  })

  it('rejects a duplicated original_index', () => {
    const map = makeMap()
    map.tubes[1] = { ...map.tubes[1]!, original_index: 2 }
    expect(() => planRestore(map)).toThrow(/permutation/)
  })

  it('rejects out-of-range shuffled_index values', () => {
    const map = makeMap()
    map.tubes[3] = { ...map.tubes[3]!, shuffled_index: 9 }
    expect(() => planRestore(map)).toThrow(/shuffled_index/)
  })

  it('rejects an unknown mode', () => {
    expect(() => planRestore(makeMap({ mode: 'magic' as never }))).toThrow(/mode/)
  })

  it('rejects an unsupported map version', () => {
    expect(() => planRestore(makeMap({ version: 2 }))).toThrow(/version/)
  })

  it('rejects tube ranges that do not match the measured cut points', () => {
    const map = makeMap()
    map.tubes[3] = { ...map.tubes[3]!, end_sec: 0 }
    expect(() => planRestore(map)).toThrow(/time ranges/)
  })

  it('rejects an empty tube list', () => {
    expect(() => planRestore(makeMap({ tubes: [], tube_count: 0, cut_points: [] }))).toThrow(/no tubes/)
  })
})

describe('buildTubeMap / planRestore round-trip', () => {
  it('produces the inverse permutation, so restore returns the original order', () => {
    const order = [3, 1, 0, 2]
    const map = buildTubeMap({
      mode: 'stream',
      tubeCount: 4,
      tubeDurationSec: 1,
      shuffleSeed: 42,
      cutPoints: [1, 2, 3],
      original: makeMap().original,
      order,
    })

    expect(map.tubes).toHaveLength(4)
    expect(map.tubes.map((tube) => tube.original_index)).toEqual(order)

    // segments[j] is the tube that was shuffled into position j, so restoring
    // means walking original positions and taking the inverse permutation.
    const restoreOrder = planRestore(map).order
    expect(restoreOrder).toEqual([2, 1, 3, 0])
    expect(restoreOrder.map((j) => order[j])).toEqual([0, 1, 2, 3])
  })

  it('rejects a non-permutation order', () => {
    expect(() =>
      buildTubeMap({
        mode: 'stream',
        tubeCount: 3,
        tubeDurationSec: 1,
        shuffleSeed: 1,
        cutPoints: [1, 2],
        original: makeMap().original,
        order: [0, 0, 1],
      }),
    ).toThrow(/permutation/)
  })
})
