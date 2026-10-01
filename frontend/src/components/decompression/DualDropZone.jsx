import { useState, useCallback, useRef } from 'react'
import { Upload, FileVideo, FileJson, X, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { formatFileSize } from '../../utils/formatters.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
const JSON_TYPES = ['application/json']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export function DualDropZone({ onFilesSelect, className, disabled }) {
  const { t } = useLanguage()
  const [videoFile, setVideoFile] = useState(null)
  const [mapFile, setMapFile] = useState(null)
  const [videoError, setVideoError] = useState(null)
  const [mapError, setMapError] = useState(null)
  const [validation, setValidation] = useState(null)
  const videoInputRef = useRef(null)
  const mapInputRef = useRef(null)

  const validateVideo = useCallback((f) => {
    if (!VIDEO_TYPES.includes(f.type)) {
      return t('decompress.unsupportedVideoFormat')
    }
    if (f.size > MAX_FILE_SIZE) {
      return t('decompress.videoTooLarge', { size: formatFileSize(MAX_FILE_SIZE) })
    }
    return null
  }, [t])

  const validateMap = useCallback((f) => {
    if (!JSON_TYPES.includes(f.type) && !f.name.endsWith('.json')) {
      return t('decompress.jsonRequired')
    }
    if (f.size > 10 * 1024 * 1024) { // 10MB for map
      return t('decompress.mapTooLarge')
    }
    return null
  }, [t])

  const crossValidate = useCallback(() => {
    if (videoFile && mapFile) {
      try {
        const map = JSON.parse(mapFile.content || '{}')
        if (map.tube_count && map.duration_sec) {
          setValidation({ valid: true, tubeCount: map.tube_count, duration: map.duration_sec })
        } else {
          setValidation({ valid: false, error: t('decompress.invalidMapFormat') })
        }
      } catch {
        setValidation({ valid: false, error: t('decompress.invalidMapJson') })
      }
    } else {
      setValidation(null)
    }
  }, [videoFile, mapFile, t])

  const handleVideoFile = useCallback((f) => {
    const err = validateVideo(f)
    if (err) {
      setVideoError(err)
      setVideoFile(null)
    } else {
      setVideoError(null)
      setVideoFile(f)
    }
    crossValidate()
    onFilesSelect?.({ video: videoFile, map: mapFile })
  }, [validateVideo, crossValidate, mapFile, onFilesSelect])

  const handleMapFile = useCallback((f) => {
    const err = validateMap(f)
    if (err) {
      setMapError(err)
      setMapFile(null)
    } else {
      setMapError(null)
      // Read JSON content for validation
      const reader = new FileReader()
      reader.onload = (e) => {
        setMapFile({ ...f, content: e.target.result })
      }
      reader.readAsText(f)
    }
    crossValidate()
    onFilesSelect?.({ video: videoFile, map: mapFile })
  }, [validateMap, crossValidate, videoFile, onFilesSelect])

  const removeVideo = (e) => {
    e.stopPropagation()
    setVideoFile(null)
    setVideoError(null)
    videoInputRef.current.value = ''
    crossValidate()
    onFilesSelect?.({ video: null, map: mapFile })
  }

  const removeMap = (e) => {
    e.stopPropagation()
    setMapFile(null)
    setMapError(null)
    mapInputRef.current.value = ''
    crossValidate()
    onFilesSelect?.({ video: videoFile, map: null })
  }

  const DropZone = ({ label, icon: Icon, file, error, onRemove, onClick, inputRef, accept, children }) => (
    <div
      className={clsx(
        'relative rounded-xl border-2 border-dashed p-6 transition-colors',
        file ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 hover:border-primary-400',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary-500') }}
      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary-500') }}
      onDrop={(e) => {
        e.preventDefault()
        e.currentTarget.classList.remove('border-primary-500')
        if (e.dataTransfer.files[0]) onClick(e.dataTransfer.files[0])
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files[0] && onClick(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      {file ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{file.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="rounded-full bg-red-500/90 p-1.5 text-white hover:bg-red-600"
            aria-label={`${t('common.removeFile')} ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 rounded-full bg-gray-100 p-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <Icon className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('decompress.dropOrBrowse')}</p>
        </div>
      )}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 mt-3 p-3 text-center text-sm text-red-500 bg-red-50 border-t border-red-200 rounded-b-xl dark:bg-red-900/20 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  )

  return (
    <div className={clsx('space-y-4', className)}>
      <DropZone
        label={t('decompress.reqVideo')}
        icon={FileVideo}
        file={videoFile}
        error={videoError}
        onRemove={removeVideo}
        onClick={handleVideoFile}
        inputRef={videoInputRef}
        accept={VIDEO_TYPES.join(',')}
      />
      <DropZone
        label={t('decompress.reqMap')}
        icon={FileJson}
        file={mapFile}
        error={mapError}
        onRemove={removeMap}
        onClick={handleMapFile}
        inputRef={mapInputRef}
        accept={JSON_TYPES.join(',')}
      />

      {validation && (
        <div className={clsx('p-3 rounded-lg', validation.valid ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800')}>
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">{t('decompress.mapValidated')}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t('decompress.tubeCountValue', { count: validation.tubeCount })} · {t('decompress.durationValue', { duration: validation.duration })}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 dark:text-red-300">{validation.error}</p>
              </>
            )}
          </div>
        </div>
      )}

      {(videoFile || mapFile) && !videoError && !mapError && validation?.valid !== false && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{t('decompress.ready')}</span>
          {validation?.valid && <span className="text-green-500">✓ {t('decompress.validPair')}</span>}
        </div>
      )}
    </div>
  )
}