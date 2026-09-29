import { useState, useMemo } from 'react'
import { Download, Trash2, Eye, Filter, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { formatFileSize, formatDate } from '../../utils/formatters.js'
import { HistoryItem } from './HistoryItem.jsx'

const TYPE_LABELS = {
  compress: 'Compress',
  decompress: 'Decompress',
}

const TYPE_COLORS = {
  compress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  decompress: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
}

export function HistoryList({ jobs, onDownload, onDelete, onView, className }) {
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [sortDesc, setSortDesc] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        if (filterType !== 'all' && job.type !== filterType) return false
        if (dateRange.from && new Date(job.createdAt) < new Date(dateRange.from)) return false
        if (dateRange.to && new Date(job.createdAt) > new Date(dateRange.to)) return false
        return true
      })
      .sort((a, b) => sortDesc 
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
      )
  }, [jobs, filterType, dateRange, sortDesc])

  const handleExport = () => {
    const data = JSON.stringify(filteredJobs, null, 2)
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
    const rows = filteredJobs.map((job) => [
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
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revcomp-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (jobs.length === 0) {
    return (
      <div className={clsx('card p-12 text-center', className)}>
        <Filter className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No history yet</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Your compression and decompression jobs will appear here</p>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Types</option>
            <option value="compress">Compress</option>
            <option value="decompress">Decompress</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx('btn btn-sm btn-outline', showFilters && 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300')}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </button>
          <button onClick={() => setSortDesc(!sortDesc)} className="btn btn-sm btn-ghost">
            {sortDesc ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn btn-sm btn-outline">
              Export JSON
            </button>
            <button onClick={handleExportCSV} className="btn btn-sm btn-outline">
              Export CSV
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredJobs.length} of {jobs.length} jobs
        </p>
      </div>

      {showFilters && (
        <div className="card p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                value={dateRange.from || ''}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value || null })}
                className="input"
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                value={dateRange.to || ''}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value || null })}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button onClick={() => setDateRange({ from: null, to: null })} className="btn btn-sm btn-outline w-full">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2" role="list">
        {filteredJobs.map((job) => (
          <HistoryItem
            key={job.jobId}
            job={job}
            typeLabel={TYPE_LABELS[job.type] || job.type}
            typeColor={TYPE_COLORS[job.type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}
            onDownload={onDownload}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </div>
  )
}