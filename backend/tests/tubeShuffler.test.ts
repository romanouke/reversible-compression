import { describe, expect, it } from 'vitest'
import { fisherYates, isPermutation, mulberry32 } from '../src/core/tubeShuffler.js'

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const left = Array.from({ length: 20 }, () => a())
    const right = Array.from({ length: 20 }, () => b())
    expect(left).toEqual(right)
  })

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 20 }, mulberry32(1))
    const b = Array.from({ length: 20 }, mulberry32(2))
    expect(a).not.toEqual(b)
  })

  it('stays within [0, 1)', () => {
    const random = mulberry32(7)
    for (let i = 0; i < 500; i += 1) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('fisherYates', () => {
  it('is deterministic for a fixed seed', () => {
    const input = Array.from({ length: 50 }, (_, index) => index)
    expect(fisherYates(input, 42)).toEqual(fisherYates(input, 42))
  })

  it('always yields a permutation of the input', () => {
    const input = Array.from({ length: 120 }, (_, index) => index)
    const shuffled = fisherYates(input, 1337)
    expect(isPermutation(shuffled)).toBe(true)
    expect(shuffled).toHaveLength(input.length)
  })

  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    fisherYates(input, 9)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('actually reorders a large input', () => {
    const input = Array.from({ length: 200 }, (_, index) => index)
    const shuffled = fisherYates(input, 42)
    expect(shuffled.some((value, index) => value !== index)).toBe(true)
  })
})

describe('isPermutation', () => {
  it('rejects duplicates, gaps and empty input', () => {
    expect(isPermutation([])).toBe(false)
    expect(isPermutation([0, 0, 1])).toBe(false)
    expect(isPermutation([0, 2])).toBe(false)
    expect(isPermutation([0, 1, 2])).toBe(true)
  })
})
