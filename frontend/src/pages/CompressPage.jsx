import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ArrowRight } from 'lucide-react'
import { VideoDropZone } from '../components/compression/VideoDropZone.jsx'
import { ConfigPanel } from '../components/compression/ConfigPanel.jsx'
import { ProgressViewer } from '../components/compression/ProgressViewer.jsx'
import { ResultPanel } from '../components/compression/ResultPanel.jsx'
import { ComparisonViewer } from '../components/compression/ComparisonViewer.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'
import { Button } from '../components/common/Button.jsx'
import { api } from '../services/api.js'
import { useToast } from '../components/ui/ToastContainer.jsx'

const DEFAULT_CONFIG = {
  tubeDurationSec: 1.0,
  shuffleSeed: 42,
  outputCodec: 'libx264',
  preset: 'medium',
  crf: 23,
  targetFps: 30,
}

export function CompressPage() {
  const [file, setFile] = useState(null)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(null)
  const [result, setResult] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const compressMutation = useMutation({
    mutationFn: ({ file, config }) => api.compress(file, config),
    onSuccess: (data) => {
      setJobId(data.job_id)
      setStatus('processing')
      pollStatus(data.job_id)
    },
    onError: (error) => {
      setStatus('failed')
      addToast({ title: 'Compression failed', description: error.message, type: 'error' })
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
        addToast({ title: 'Compression complete', description: 'Video compressed successfully', type: 'success' })
      } else if (data.status === 'failed') {
        addToast({ title: 'Compression failed', description: data.error || 'Unknown error', type: 'error' })
      } else {
        setTimeout(() => pollStatus(id), 1000)
      }
    } catch (error) {
      console.error('Polling error:', error)
      setTimeout(() => pollStatus(id), 2000)
    }
  }, [])

  const handleStart = () => {
    if (!file) {
      addToast({ title: 'No file', description: 'Please select a video file first', type: 'warning' })
      return
    }
    compressMutation.mutate({ file, config })
  }

  const handleNewJob = () => {
    setFile(null)
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setStage(null)
    setResult(null)
  }

  const handleDownload = (type) => {
    if (jobId) {
      api.download(jobId, type).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${jobId.slice(0, 8)}.${type === 'map' ? 'json' : 'mp4'}`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compress Video</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload a video, configure tube-based reordering settings, and compress with lossless restoration guarantee.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Config Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-0">
              <ConfigPanel config={config} onChange={(key, value) => setConfig((prev) => ({ ...prev, [key]: value }))} disabled={status === 'processing'} />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload & Preview */}
          <Card>
            <CardContent className="pt-6">
              <VideoDropZone
                onFileSelect={setFile}
                disabled={status === 'processing'}
              />
            </CardContent>
          </Card>

          {/* Progress */}
          {(status === 'processing' || status === 'completed' || status === 'failed') && (
            <Card>
              <CardContent className="pt-6">
                <ProgressViewer
                  jobId={jobId}
                  status={status}
                  stage={stage}
                  progress={progress}
                  onCancel={() => { /* TODO: implement cancel */ }}
                />
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {status === 'completed' && result && (
            <Card>
              <CardContent className="pt-6">
                <ResultPanel
                  result={result}
                  onDownload={handleDownload}
                  onCompare={() => setShowComparison(true)}
                  onNewJob={handleNewJob}
                />
              </CardContent>
            </Card>
          )}

          {/* Start Button */}
          {status === 'idle' && file && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleStart}
                disabled={compressMutation.isPending}
                className="w-full max-w-md"
                rightIcon={compressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              >
                {compressMutation.isPending ? 'Starting...' : 'Start Compression'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <ComparisonViewer
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        originalSrc={result?.originalVideoUrl}
        compressedSrc={result?.compressedVideoUrl}
        restoredSrc={result?.restoredVideoUrl}
      />
    </div>
  )
}