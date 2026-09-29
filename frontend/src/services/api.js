const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const WS_BASE = import.meta.env.VITE_WS_BASE || '/api/ws'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body)
  } else if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: response.statusText }
    }
    throw new ApiError(errorData.message || 'Request failed', response.status, errorData)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  // Compression
  compress: (file, config) => {
    const formData = new FormData()
    formData.append('video', file)
    Object.entries(config).forEach(([key, value]) => {
      formData.append(key, value)
    })
    return request('/compress', { method: 'POST', body: formData })
  },

  // Decompression
  decompress: (videoFile, mapFile) => {
    const formData = new FormData()
    formData.append('compressed_video', videoFile)
    formData.append('tube_map', mapFile)
    return request('/decompress', { method: 'POST', body: formData })
  },

  // Status
  getStatus: (jobId) => request(`/status/${jobId}`),

  // Download
  download: (jobId, fileType) => {
    return fetch(`${API_BASE}/download/${jobId}/${fileType}`).then((res) => {
      if (!res.ok) throw new ApiError('Download failed', res.status)
      return res.blob()
    })
  },

  // History (mock - replace with real API)
  getHistory: () => {
    const stored = localStorage.getItem('revcomp-history')
    return Promise.resolve(stored ? JSON.parse(stored) : [])
  },

  deleteHistory: (jobId) => {
    const stored = localStorage.getItem('revcomp-history')
    const jobs = stored ? JSON.parse(stored) : []
    const filtered = jobs.filter((j) => j.jobId !== jobId)
    localStorage.setItem('revcomp-history', JSON.stringify(filtered))
    return Promise.resolve()
  },

  // Health
  health: () => request('/health'),
}

export function createWebSocket(jobId, onMessage, onClose, onError) {
  const ws = new WebSocket(`${WS_BASE}/${jobId}`)

  ws.onopen = () => console.log('WebSocket connected')
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (err) {
      console.error('WS message parse error:', err)
    }
  }
  ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason)
    if (onClose) onClose(event)
  }
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    if (onError) onError(error)
  }

  return ws
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '-'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function validateVideoFile(file) {
  const acceptedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
  const maxSize = 500 * 1024 * 1024 // 500MB

  if (!acceptedTypes.includes(file.type)) {
    return 'Unsupported file type. Please upload MP4, MOV, AVI, or MKV.'
  }
  if (file.size > maxSize) {
    return `File too large. Maximum size is ${formatFileSize(maxSize)}.`
  }
  return null
}

export function validateJsonFile(file) {
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    return 'Please upload a JSON file.'
  }
  if (file.size > maxSize) {
    return 'Map file too large.'
  }
  return null
}