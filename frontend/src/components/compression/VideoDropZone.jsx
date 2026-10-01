import { useState, useCallback, useRef } from 'react'
import { Upload, FileVideo, X, CheckCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { VideoPlayer } from '../ui/VideoPlayer.jsx'
import { formatFileSize } from '../../utils/formatters.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export function VideoDropZone({ onFileSelect, acceptedTypes = ACCEPTED_TYPES, maxSize = MAX_FILE_SIZE, className, disabled }) {
  const { t } = useLanguage()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validateFile = useCallback((f) => {
    if (!acceptedTypes.includes(f.type)) {
      return t('compress.unsupportedFile')
    }
    if (f.size > maxSize) {
      return t('compress.fileTooLarge', { size: formatFileSize(maxSize) })
    }
    return null
  }, [acceptedTypes, maxSize, t])

  const handleFile = useCallback((f) => {
    const err = validateFile(f)
    if (err) {
      setError(err)
      setFile(null)
      setPreviewUrl(null)
      onFileSelect?.(null)
      return
    }
    setError(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    onFileSelect?.(f)
  }, [validateFile, onFileSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  const handleInputChange = (e) => {
    if (e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeFile = (e) => {
    e.stopPropagation()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    onFileSelect?.(null)
  }

  if (file && previewUrl) {
    return (
      <div className={clsx('relative rounded-xl border-2 transition-colors', className, error ? 'border-red-500' : 'border-green-500')}>
        <VideoPlayer
          src={previewUrl}
          className="rounded-t-xl aspect-video"
          muted
          playsInline
        />
        <div className="absolute top-2 right-2">
          <button
            onClick={removeFile}
            className="rounded-full bg-red-500/90 p-1.5 text-white hover:bg-red-600"
            aria-label={t('common.removeFile')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileVideo className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'relative rounded-xl border-2 border-dashed transition-colors',
        dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 hover:border-primary-400',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
          aria-label={t('compress.dropZone')}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
        aria-hidden="true"
      />
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className={clsx('mb-4 rounded-full p-3', dragActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>
          <Upload className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {dragActive ? t('compress.dropHere') : t('compress.dragDrop')}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('compress.browse')}
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {t('compress.formats')} · {t('compress.maxSize', { size: formatFileSize(maxSize) })}
        </p>
      </div>
      {error && (
        <div className="absolute bottom-0 left-0 right-0 p-3 text-center text-sm text-red-500 bg-red-50 border-t border-red-200 rounded-b-xl dark:bg-red-900/20 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  )
}