import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { safeJoin } from '../src/utils/paths.js'
import { parseCodec, parseCrf, parseMode, parsePreset, parseSeed, sanitizeFilename, ValidationError } from '../src/utils/validate.js'

describe('safeJoin', () => {
  const base = path.resolve('storage', 'output')

  it('allows paths inside the base', () => {
    expect(safeJoin(base, 'job_1/compressed.mp4')).toBe(path.join(base, 'job_1', 'compressed.mp4'))
  })

  it('rejects parent traversal', () => {
    expect(() => safeJoin(base, '../../etc/passwd')).toThrow(/traversal/i)
  })

  it('rejects absolute escapes', () => {
    expect(() => safeJoin(base, path.resolve('C:/Windows/System32'))).toThrow(/traversal/i)
  })

  it('rejects a sibling directory sharing the prefix', () => {
    expect(() => safeJoin(base, `${base}_evil/file.mp4`)).toThrow(/traversal/i)
  })
})

describe('sanitizeFilename', () => {
  it('strips directory components', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd')
    expect(sanitizeFilename('C:\\Windows\\evil.mp4')).toBe('evil.mp4')
  })

  it('caps the length at 255 characters', () => {
    expect(sanitizeFilename(`${'a'.repeat(400)}.mp4`)).toHaveLength(255)
  })

  it('removes control characters', () => {
    expect(sanitizeFilename('a\u0000b\u001fc.mp4')).toBe('abc.mp4')
  })

  it('falls back for empty input', () => {
    expect(sanitizeFilename('   ')).toBe('upload')
  })
})

describe('option parsing', () => {
  it('parses and bounds the seed', () => {
    expect(parseSeed('42', 7)).toBe(42)
    expect(parseSeed(undefined, 7)).toBe(7)
    expect(() => parseSeed('-1', 7)).toThrow(ValidationError)
    expect(() => parseSeed('3.5', 7)).toThrow(ValidationError)
  })

  it('restricts mode to stream|reencode', () => {
    expect(parseMode(undefined, 'stream')).toBe('stream')
    expect(parseMode('reencode', 'stream')).toBe('reencode')
    expect(() => parseMode('turbo', 'stream')).toThrow(ValidationError)
  })

  it('restricts crf to 0..51', () => {
    expect(parseCrf('23', 23)).toBe(23)
    expect(() => parseCrf('52', 23)).toThrow(ValidationError)
    expect(() => parseCrf('-1', 23)).toThrow(ValidationError)
  })

  it('only accepts allowlisted codecs', () => {
    expect(parseCodec('libx264', 'libx264')).toBe('libx264')
    expect(() => parseCodec('libx264; rm -rf /', 'libx264')).toThrow(ValidationError)
    expect(() => parseCodec('libx264 -vf', 'libx264')).toThrow(ValidationError)
  })

  it('only accepts preset names without shell metacharacters', () => {
    expect(parsePreset('slow', 'medium')).toBe('slow')
    expect(() => parsePreset('fast;rm', 'medium')).toThrow(ValidationError)
  })
})
