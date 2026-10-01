import { Download, FileVideo, FileJson, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { formatFileSize, formatDuration } from '../../utils/formatters.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

export function ResultPanel({ result, onDownload, onCompare, onNewJob, className }) {
  const { t } = useLanguage()
  if (!result) return null

  const files = [
    {
      key: 'compressed',
      label: 'compressedVideo',
      icon: FileVideo,
      size: result.compressedSize,
      url: result.compressedVideoUrl,
      type: 'video',
    },
    {
      key: 'map',
      label: 'tubeMap',
      icon: FileJson,
      size: result.tubeMapSize,
      url: result.tubeMapUrl,
      type: 'json',
    },
    {
      key: 'restored',
      label: 'restoredVideo',
      icon: FileVideo,
      size: result.restoredSize,
      url: result.restoredVideoUrl,
      type: 'video',
    },
  ].filter((f) => f.url)

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('compress.results')}</h3>
        {result.md5Match === true && (
          <div className={clsx('flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
          )}>
            <CheckCircle className="h-4 w-4" />
            {t('compress.verified')}
          </div>
        )}
        {result.md5Match === false && result.lossless && (
          <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <XCircle className="h-4 w-4" />
            {t('compress.mismatch')}
          </div>
        )}
        {result.md5Match === false && !result.lossless && (
          <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            <Info className="h-4 w-4" />
            {t('compress.lossyMismatch')}
          </div>
        )}
        {result.md5Match === null && (
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <Info className="h-4 w-4" />
            {t('compress.verifyAfterRestore')}
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
                  <p className="font-medium text-gray-900 dark:text-gray-100">{t(`compress.${file.label}`)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownload?.(file.key)}
                  className="btn btn-sm btn-outline"
                  aria-label={`${t('common.download')} ${t(`compress.${file.label}`)}`}
                >
                  <Download className="h-4 w-4" />
                </button>
                {file.type === 'video' && (
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="btn btn-sm btn-ghost"
                    aria-label={t('compress.openInNewTab', { file: t(`compress.${file.label}`) })}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('compress.originalSize')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize(result.originalSize)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('compress.ratio')}</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{result.compressionRatio?.toFixed(2) || '1.00'}x</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('compress.duration')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(result.durationSec)}</p>
        </div>
      </div>

      {result.warnings?.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('compress.serverNotes')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-300">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onCompare} className="btn btn-secondary" disabled={!result.restoredVideoUrl}>
          <FileVideo className="h-4 w-4 mr-2" />
          {t('compress.compare')}
        </button>
        <button onClick={onNewJob} className="btn btn-outline">
          {t('compress.newJob')}
        </button>
      </div>
    </div>
  )
}