import { describe, expect, it } from 'vitest'
import { buildCutPoints, dedupeKeyframes, matchCutPoints } from '../src/core/ffprobe.js'

const frames = [0, 2, 4, 6, 8].map((timeSec) => ({ timeSec, pts: timeSec * 90_000 }))

describe('dedupeKeyframes', () => {
  it('drops keyframes closer together than the gap', () => {
    const dense = [0, 0.02, 2, 4.01].map((timeSec) => ({ timeSec, pts: 0 }))
    expect(dedupeKeyframes(dense, 1).map((frame) => frame.timeSec)).toEqual([0, 2, 4.01])
  })
})

describe('buildCutPoints', () => {
  it('snaps nominal boundaries to the nearest keyframe', () => {
    expect(buildCutPoints([1, 3, 5, 7], frames)).toEqual([2, 4, 6, 8])
  })

  describe('matchCutPoints', () => {
    it('matches boundaries to distinct measured keyframes', () => {
      expect(matchCutPoints([1.99, 3.99], frames, 0.1)).toEqual([2, 4])
    })

    it('rejects boundaries that cannot be split on an output keyframe', () => {
      expect(() => matchCutPoints([1, 2], [{ timeSec: 0, pts: 0 }, { timeSec: 2, pts: 0 }], 0.1)).toThrow(
        /No measured keyframe/,
      )
    })
  })

  it('keeps the same length when distinct measured keyframes exist', () => {
    const ideal = [1, 3, 5, 7]
    expect(buildCutPoints(ideal, frames)).toHaveLength(ideal.length)
  })

  it('never returns a cut at the start of the stream', () => {
    expect(buildCutPoints([0.01, 3], frames)[0]).toBeGreaterThan(0)
  })

  it('rejects boundaries when the encoder merged their keyframes', () => {
    const sparse = [{ timeSec: 0, pts: 0 }, { timeSec: 10, pts: 0 }]
    expect(() => buildCutPoints([1, 2, 3, 4, 5], sparse)).toThrow(/No measured keyframe/)
  })

  it('rejects boundaries when there are no keyframes', () => {
    expect(() => buildCutPoints([1, 2, 3], [])).toThrow(/No measured keyframe/)
  })
})
