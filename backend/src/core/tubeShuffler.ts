/**
 * Deterministic Fisher-Yates. A seeded PRNG (mulberry32) is used instead of
 * Math.random so the same seed always yields the same permutation, which is what
 * makes the ID map reproducible across runs and machines.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function fisherYates<T>(items: readonly T[], seed: number): T[] {
  const out = [...items]
  const random = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const a = out[i] as T
    const b = out[j] as T
    out[i] = b
    out[j] = a
  }
  return out
}

export function isPermutation(values: readonly number[]): boolean {
  if (values.length === 0) return false
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.every((value, index) => value === index)
}
