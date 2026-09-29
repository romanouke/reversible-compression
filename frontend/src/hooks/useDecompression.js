import { useState, useCallback } from 'react'
import { api } from '../services/api.js'
import { useToast } from '../components/ui/ToastContainer.jsx'

export function useDecompression() {
  const [files, setFiles] = useState({ video: null, map: null })
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(null)
  const [result, setResult] = useState(null)
  const [md5Match, setMd5Match] = useState(null)
  const [error, setError] = useState(null)
  const { addToast } = useToast()

  const updateFile = useCallback((type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }))
  }, [])

  const startDecompression = useCallback(async () => {
    if (!files.video || !files.map) {
      addToast({ title: 'Missing files', description: 'Please provide both compressed video and tube map', type: 'warning' })
      return
    }

    setStatus('processing')
    setProgress(0)
    setStage('split')
    setError(null)
    setMd5Match(null)

    try {
      const data = await api.decompress(files.video, files.map)
      setJobId(data.job_id)
      pollStatus(data.job_id)
    } catch (err) {
      setStatus('failed')
      setError(err.message)
      addToast({ title: 'Decompression failed', description: err.message, type: 'error' })
    }
  }, [files, addToast])

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
          addToast({ title: 'Restoration complete', description: 'Original media content verified.', type: 'success' })
        } else if (data.result?.lossless === false) {
          addToast({ title: 'Restoration complete', description: 'The video was re-encoded, so an identical restoration is not possible.', type: 'warning' })
        } else if (data.result?.md5Match === false) {
          addToast({ title: 'Integrity check failed', description: 'Restored content does not match the original.', type: 'error' })
        } else {
          addToast({ title: 'Restoration complete', description: 'Integrity could not be verified.', type: 'warning' })
        }
      } else if (data.status === 'failed') {
        setStatus('failed')
        setError(data.error || 'Unknown error')
        addToast({ title: 'Decompression failed', description: data.error, type: 'error' })
      } else {
        setTimeout(() => pollStatus(id), 1000)
      }
    } catch (err) {
      console.error('Polling error:', err)
      setTimeout(() => pollStatus(id), 2000)
    }
  }, [addToast])

  const reset = useCallback(() => {
    setFiles({ video: null, map: null })
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setStage(null)
    setResult(null)
    setMd5Match(null)
    setError(null)
  }, [])

  return {
    files,
    updateFile,
    jobId,
    status,
    progress,
    stage,
    result,
    md5Match,
    error,
    startDecompression,
    reset,
    isProcessing: status === 'processing',
  }
}
