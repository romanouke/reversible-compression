import { Download, Trash2, Eye, Clock, FileVideo, FileJson, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { formatFileSize, formatDate, formatDuration } from '../../utils/formatters.js'

const STATUS_ICONS = {
  completed: CheckCircle,
  failed: XCircle,
  processing: Loader2,
  queued: Clock,
}

const STATUS_COLORS = {
  completed: 'text-green-600 dark:text-green-400',
  failed: 'text-red-600 dark:text-red-400',
  processing: 'text-primary-600 dark:text-primary-400 animate-spin',
  queued: 'text-gray-500 dark:text-gray-400',
}

export function HistoryItem({ job, typeLabel, typeColor, onDownload, onDelete, onView }) {
  const StatusIcon = STATUS_ICONS[job.status] || Clock
  const statusColor = STATUS_COLORS[job.status] || 'text-gray-500'

  return (
    <div className={clsx('card p-4', job.status === 'processing' && 'animate-pulse')} role="listitem">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className={clsx('badge', typeColor)}>{typeLabel}</span>
          <div>
            <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{job.jobId.slice(0, 8)}...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(job.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={clsx('h-4 w-4', statusColor)} />
            <span className={clsx('text-sm font-medium capitalize', statusColor)}>{job.status}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {job.originalSize && (
            <span className="flex items-center gap-1">
              <FileVideo className="h-4 w-4" />
              {formatFileSize(job.originalSize)}
            </span>
          )}
          {job.outputSize && (
            <span className="flex items-center gap-1">
              <FileJson className="h-4 w-4" />
              {formatFileSize(job.outputSize)}
            </span>
          )}
          {job.ratio && (
            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              Ratio: {job.ratio.toFixed(2)}x
            </span>
          )}
          {job.durationSec && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(job.durationSec)}
            </span>
          )}
          {job.tubeCount && (
            <span className="flex items-center gap-1">
              Tubes: {job.tubeCount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {job.status === 'completed' && job.resultUrl && (
            <button
              onClick={() => onDownload?.(job.jobId)}
              className="btn btn-sm btn-outline"
              aria-label="Download result"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          )}
          <button
            onClick={() => onView?.(job.jobId)}
            className="btn btn-sm btn-ghost"
            aria-label="View details"
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </button>
          <button
            onClick={() => onDelete?.(job.jobId)}
            className="btn btn-sm btn-ghost text-red-600 hover:text-red-700 dark:text-red-400"
            aria-label="Delete from history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {job.error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{job.error}</span>
          </div>
        </div>
      )}
    </div>
  )
}