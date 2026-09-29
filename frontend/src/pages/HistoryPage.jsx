import { useState, useEffect } from 'react'
import { Download, Trash2, Eye, RotateCcw, Filter, Calendar, ChevronDown, ChevronUp, FileText, Download as DownloadIcon } from 'lucide-react'
import { HistoryList } from '../components/history/HistoryList.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'
import { Button } from '../components/common/Button.jsx'
import { Modal } from '../components/common/Modal.jsx'
import { api } from '../services/api.js'
import { formatFileSize, formatDate, formatDuration } from '../utils/formatters.js'
import { useToast } from '../components/ui/ToastContainer.jsx'
import { clsx } from 'clsx'

const TYPE_LABELS = { compress: 'Compress', decompress: 'Decompress' }
const TYPE_COLORS = { compress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200', decompress: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' }
const STATUS_ICONS = { completed: '✓', failed: '✗', processing: '⟳', queued: '⏳' }
const STATUS_COLORS = { completed: 'text-green-600 dark:text-green-400', failed: 'text-red-600 dark:text-red-400', processing: 'text-primary-600 dark:text-primary-400', queued: 'text-gray-500 dark:text-gray-400' }

export function HistoryPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailJob, setDetailJob] = useState(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await api.getHistory()
      setJobs(data)
    } catch (error) {
      addToast({ title: 'Failed to load history', description: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (jobId) => {
    try {
      const job = jobs.find(j => j.jobId === jobId)
      if (!job) return
      const blob = await api.download(jobId, job.type === 'compress' ? 'compressed' : 'restored')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${job.type}_${jobId.slice(0, 8)}.${job.type === 'compress' ? 'mp4' : 'mp4'}`
      a.click()
      URL.revokeObjectURL(url)
      addToast({ title: 'Download started', type: 'success' })
    } catch (error) {
      addToast({ title: 'Download failed', description: error.message, type: 'error' })
    }
  }

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this job from history?')) return
    try {
      await api.deleteHistory(jobId)
      setJobs(jobs.filter(j => j.jobId !== jobId))
      addToast({ title: 'Deleted', type: 'success' })
    } catch (error) {
      addToast({ title: 'Delete failed', description: error.message, type: 'error' })
    }
  }

  const handleView = (jobId) => {
    const job = jobs.find(j => j.jobId === jobId)
    if (job) setDetailJob(job)
  }

  const handleExportJSON = () => {
    const data = JSON.stringify(jobs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revcomp-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const headers = ['Job ID', 'Type', 'Status', 'Created', 'Original Size', 'Output Size', 'Ratio', 'Duration', 'Tube Count']
    const rows = jobs.map((job) => [
      job.jobId,
      TYPE_LABELS[job.type] || job.type,
      job.status,
      formatDate(job.createdAt),
      formatFileSize(job.originalSize || 0),
      formatFileSize(job.outputSize || 0),
      job.ratio ? job.ratio.toFixed(2) : '-',
      job.durationSec ? `${job.durationSec}s` : '-',
      job.tubeCount || '-',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revcomp-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">History</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and manage your compression and decompression jobs.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportJSON} leftIcon={<FileText className="h-4 w-4" />}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={handleExportCSV} leftIcon={<DownloadIcon className="h-4 w-4" />}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadHistory} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Refresh
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{jobs.length} jobs</p>
      </div>

      <HistoryList
        jobs={jobs}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailJob}
        onClose={() => setDetailJob(null)}
        title="Job Details"
        className="max-w-2xl"
      >
        {detailJob && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Job ID</p>
                <p className="font-mono text-sm">{detailJob.jobId}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <span className={clsx('badge', TYPE_COLORS[detailJob.type])}>{TYPE_LABELS[detailJob.type]}</span>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className={clsx('badge', STATUS_COLORS[detailJob.status])}>{detailJob.status}</span>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-mono text-sm">{formatDate(detailJob.createdAt)}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Original Size</p>
                <p>{formatFileSize(detailJob.originalSize || 0)}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Output Size</p>
                <p>{formatFileSize(detailJob.outputSize || 0)}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Compression Ratio</p>
                <p className="text-primary-600 dark:text-primary-400 font-medium">{detailJob.ratio ? detailJob.ratio.toFixed(2) : '-'}x</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                <p>{detailJob.durationSec ? formatDuration(detailJob.durationSec) : '-'}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tube Count</p>
                <p>{detailJob.tubeCount || '-'}</p>
              </div>
            </div>

            {detailJob.config && (
              <div className="card p-4">
                <h4 className="font-medium mb-2">Configuration</h4>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">{JSON.stringify(detailJob.config, null, 2)}</pre>
              </div>
            )}

            {detailJob.error && (
              <div className="card p-4 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Error</h4>
                <p className="text-sm text-red-600 dark:text-red-400">{detailJob.error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => handleDownload(detailJob.jobId)} leftIcon={<DownloadIcon className="h-4 w-4" />}>
                Download Result
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(detailJob.jobId)} leftIcon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}