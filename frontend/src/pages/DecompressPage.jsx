import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { DualDropZone } from '../components/decompression/DualDropZone.jsx'
import { RestoreProgress } from '../components/decompression/RestoreProgress.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'
import { Button } from '../components/common/Button.jsx'
import { api } from '../services/api.js'
import { useToast } from '../components/ui/ToastContainer.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export function DecompressPage() {
  const { t } = useLanguage()
  const [files, setFiles] = useState({ video: null, map: null })
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(null)
  const [result, setResult] = useState(null)
  const [md5Match, setMd5Match] = useState(null)
  const { addToast } = useToast()

  const decompressMutation = useMutation({
    mutationFn: ({ video, map }) => api.decompress(video, map),
    onSuccess: (data) => {
      setJobId(data.job_id)
      setStatus('processing')
      pollStatus(data.job_id)
    },
    onError: (error) => {
      setStatus('failed')
      addToast({ title: t('notifications.decompressionFailed'), description: error.message, type: 'error' })
    },
  })

  const pollStatus = useCallback(async (id) => {
    try {
      const data = await api.getStatus(id)
      setProgress(data.progress || 0)
      setStage(data.stage)
      setStatus(data.status)

      if (data.status === 'completed') {
        setResult(data.result)
        setMd5Match(data.result?.md5Match ?? null)
        if (data.result?.md5Match === true) {
          addToast({ title: t('notifications.decompressionComplete'), description: t('decompress.md5Match'), type: 'success' })
        } else if (data.result?.lossless === false) {
          addToast({ title: t('notifications.decompressionComplete'), description: t('decompress.lossyNote'), type: 'warning' })
        } else if (data.result?.md5Match === false) {
          addToast({ title: t('decompress.integrityFailed'), description: t('decompress.md5Mismatch'), type: 'error' })
        } else {
          addToast({ title: t('notifications.decompressionComplete'), description: t('decompress.hashMissing'), type: 'warning' })
        }
      } else if (data.status === 'failed') {
        addToast({ title: t('notifications.decompressionFailed'), description: data.error || t('common.error'), type: 'error' })
      } else {
        setTimeout(() => pollStatus(id), 1000)
      }
    } catch (error) {
      console.error('Polling error:', error)
      setTimeout(() => pollStatus(id), 2000)
    }
  }, [t])

  const handleStart = () => {
    if (!files.video || !files.map) {
      addToast({ title: t('notifications.missingFiles'), description: t('decompress.missingFilesDescription'), type: 'warning' })
      return
    }
    decompressMutation.mutate(files)
  }

  const handleNewJob = () => {
    setFiles({ video: null, map: null })
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setStage(null)
    setResult(null)
    setMd5Match(null)
  }

  const handleDownload = () => {
    if (jobId && result?.restoredVideoUrl) {
      api.download(jobId, 'restored').then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `restored_${jobId.slice(0, 8)}.mp4`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('decompress.title')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('decompress.subtitle')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Info Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('decompress.requirements')}</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t('decompress.reqVideo')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t('decompress.reqMap')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t('decompress.reqMatch')}
                </li>
              </ul>
              <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The tube map carries the shuffle order and measured cut points; you do not need to re-enter the tube duration or shuffle seed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dual Drop Zone */}
          <Card>
            <CardContent className="pt-6">
              <DualDropZone
                onFilesSelect={setFiles}
                disabled={status === 'processing'}
              />
            </CardContent>
          </Card>

          {/* Progress */}
          {(status === 'processing' || status === 'completed' || status === 'failed') && (
            <Card>
              <CardContent className="pt-6">
                <RestoreProgress
                  status={status}
                  stage={stage}
                  progress={progress}
                  onCancel={() => { /* TODO: implement cancel */ }}
                  md5Match={md5Match}
                  lossless={result?.lossless}
                  warnings={result?.warnings}
                />
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {status === 'completed' && result && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('compress.restoredVideo')}</h3>
                    {md5Match !== null && (
                      <div className={clsx('flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                        md5Match
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : result.lossless
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                      )}>
                        {md5Match ? `✓ ${t('compress.verified')}` : result.lossless ? `✗ ${t('compress.mismatch')}` : t('decompress.lossyRestoration')}
                      </div>
                    )}
                    {md5Match === null && (
                      <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {result.lossless ? t('decompress.integrityUnknown') : t('decompress.lossyRestoration')}
                      </div>
                    )}
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 7V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                            <polyline points="17 7 12 12 7 7" />
                          </svg>
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{t('compress.restoredVideo')}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{result.restoredSize ? `${(result.restoredSize / 1024 / 1024).toFixed(1)} MB` : t('common.ready')}</p>
                        </div>
                      </div>
                      <Button onClick={handleDownload} rightIcon={<ArrowRight className="h-4 w-4" />}>
                        {t('common.download')}
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleNewJob} className="w-full">
                    {t('decompress.newJob')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Button */}
          {status === 'idle' && files.video && files.map && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleStart}
                disabled={decompressMutation.isPending}
                className="w-full max-w-md"
                rightIcon={decompressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              >
                {decompressMutation.isPending ? t('decompress.starting') : t('decompress.startButton')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}