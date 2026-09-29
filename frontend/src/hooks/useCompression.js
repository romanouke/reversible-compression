import { useState, useCallback } from 'react'
import { api } from '../services/api.js'
import { useToast } from '../components/ui/ToastContainer.jsx'

export function useCompression() {
  const [file, setFile] = useState(null)
  const [config, setConfig] = useState({
    tubeDurationSec: 1.0,
    shuffleSeed: 42,
    outputCodec: 'libx264',
    preset: 'medium',
    crf: 23,
  })
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { addToast } = useToast()

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const startCompression = useCallback(async () => {
    if (!file) {
      addToast({ title: 'No file selected', type: 'warning' })
      return
    }

    setStatus('processing')
    setProgress(0)
    setStage('split')
    setError(null)

    try {
      const data = await api.compress(file, config)
      setJobId(data.job_id)
      pollStatus(data.job_id)
    } catch (err) {
      setStatus('failed')
      setError(err.message)
      addToast({ title: 'Compression failed', description: err.message, type: 'error' })
    }
  }, [file, config, addToast])

  const pollStatus = useCallback(async (id) => {
    try {
      const data = await api.getStatus(id)
      setProgress(data.progress || 0)
      setStage(data.stage)
      setStatus(data.status)

      if (data.status === 'completed') {
        setResult(data.result)
        addToast({ title: 'Compression complete', type: 'success' })
      } else if (data.status === 'failed') {
        setStatus('failed')
        setError(data.error || 'Unknown error')
        addToast({ title: 'Compression failed', description: data.error, type: 'error' })
      } else {
        setTimeout(() => pollStatus(id), 1000)
      }
    } catch (err) {
      console.error('Polling error:', err)
      setTimeout(() => pollStatus(id), 2000)
    }
  }, [addToast])

  const reset = useCallback(() => {
    setFile(null)
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setStage(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    file,
    setFile,
    config,
    updateConfig,
    jobId,
    status,
    progress,
    stage,
    result,
    error,
    startCompression,
    reset,
    isProcessing: status === 'processing',
  }
}
