import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'
import { config } from '../src/config.js'

const app = createApp()

describe('GET /health', () => {
  it('reports ffmpeg and ffprobe availability', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('healthy')
    expect(response.body.checks.ffmpeg.status).toBe('ok')
    expect(response.body.checks.ffprobe.status).toBe('ok')
    expect(response.body.checks.storage.status).toBe('ok')
  })

  it('is aliased under /api/health for the frontend proxy', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body.checks.ffmpeg.status).toBe('ok')
  })
})

describe('validation errors', () => {
  it('rejects a compress request with no video field', async () => {
    const response = await request(app).post('/api/compress').field('tube_duration_sec', '1')
    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/video/i)
  })

  it('rejects a decompress request with only one file', async () => {
    const response = await request(app).post('/api/decompress').attach('tube_map', Buffer.from('{}'), 'tube_map.json')
    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/required/i)
  })

  it('enforces the configured tube map size limit', async () => {
    const video = Buffer.alloc(12)
    video.write('....ftyp', 0, 'latin1')
    const response = await request(app)
      .post('/api/decompress')
      .attach('compressed_video', video, { filename: 'compressed.mp4', contentType: 'video/mp4' })
      .attach('tube_map', Buffer.alloc(config.maxMapBytes + 1), {
        filename: 'tube_map.json',
        contentType: 'application/json',
      })

    expect(response.status).toBe(413)
    expect(response.body.message).toMatch(/tube map.*limit/i)
  })

  it('rejects an unknown job id', async () => {
    const response = await request(app).get('/api/status/00000000-0000-0000-0000-000000000000')
    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/unknown job_id/i)
  })

  it('rejects a file_type outside the allowlist', async () => {
    const response = await request(app).get('/api/download/00000000-0000-0000-0000-000000000000/../../../etc/passwd')
    expect([400, 404]).toContain(response.status)
    expect(response.body.message).toBeTruthy()
  })

  it('returns 404 json for unknown endpoints', async () => {
    const response = await request(app).get('/api/nope')
    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Endpoint not found')
  })
})
