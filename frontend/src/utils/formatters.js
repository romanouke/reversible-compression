export function formatFileSize(bytes) {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B'
  if (isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatBytes(bytes) {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B'
  if (isNaN(bytes)) return '0 B'
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
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-'
  return new Intl.NumberFormat().format(num)
}

export function truncate(str, length = 50) {
  if (!str || str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateId() {
  return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function throttle(fn, limit) {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}