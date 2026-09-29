import { Download, FileVideo, FileJson, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { formatFileSize, formatDuration } from '../../utils/formatters.js'

export function ResultPanel({ result, onDownload, onCompare, onNewJob, className }) {
  if (!result) return null

  const files = [
    {
      key: 'compressed',
      label: 'Compressed Video',
      icon: FileVideo,
      size: result.compressedSize,
      url: result.compressedVideoUrl,
      type: 'video',
    },
    {
      key: 'map',
      label: 'Tube Map (JSON)',
      icon: FileJson,
      size: result.tubeMapSize,
      url: result.tubeMapUrl,
      type: 'json',
    },
    {
      key: 'restored',
      label: 'Restored Video',
      icon: FileVideo,
      size: result.restoredSize,
      url: result.restoredVideoUrl,
      type: 'video',
    },
  ].filter((f) => f.url)

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Results</h3>
        {result.md5Match !== undefined && (
          <div className={clsx('flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
            result.md5Match ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          )}>
            {result.md5Match ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Lossless verified (MD5 match)
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                MD5 mismatch!
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <div key={file.key} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <file.icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{file.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownload?.(file.key)}
                  className="btn btn-sm btn-outline"
                  aria-label={`Download ${file.label}`}
                >
                  <Download className="h-4 w-4" />
                </button>
                {file.type === 'video' && (
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="btn btn-sm btn-ghost"
                    aria-label={`Open ${file.label} in new tab`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Original Size</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize(result.originalSize)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Compression Ratio</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{result.compressionRatio?.toFixed(2) || '1.00'}x</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(result.durationSec)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onCompare} className="btn btn-secondary" disabled={!result.restoredVideoUrl}>
          <FileVideo className="h-4 w-4 mr-2" />
          Compare Side-by-Side
        </button>
        <button onClick={onNewJob} className="btn btn-outline">
          New Job
        </button>
      </div>
    </div>
  )
}