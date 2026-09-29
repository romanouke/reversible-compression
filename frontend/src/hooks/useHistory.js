import { useState, useEffect, useCallback } from 'react'
import { saveJob, getAllJobs, deleteJob, clearAllJobs, migrateFromLocalStorage } from '../services/storage.js'
import { useToast } from '../components/ui/ToastContainer.jsx'

export function useHistory() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllJobs()
      setJobs(data.reverse())
    } catch (err) {
      console.error('Failed to load jobs:', err)
      addToast({ title: 'Failed to load history', description: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    migrateFromLocalStorage().then(() => loadJobs())
  }, [loadJobs])

  const addJob = useCallback(async (job) => {
    const saved = await saveJob(job)
    setJobs(prev => [saved, ...prev])
    return saved
  }, [])

  const updateJob = useCallback(async (jobId, updates) => {
    const job = jobs.find(j => j.jobId === jobId)
    if (!job) return
    const updated = { ...job, ...updates, updatedAt: new Date().toISOString() }
    await saveJob(updated)
    setJobs(prev => prev.map(j => j.jobId === jobId ? updated : j))
  }, [jobs])

  const removeJob = useCallback(async (jobId) => {
    await deleteJob(jobId)
    setJobs(prev => prev.filter(j => j.jobId !== jobId))
  }, [])

  const clearHistory = useCallback(async () => {
    await clearAllJobs()
    setJobs([])
    addToast({ title: 'History cleared', type: 'success' })
  }, [addToast])

  return {
    jobs,
    loading,
    addJob,
    updateJob,
    removeJob,
    clearHistory,
    refresh: loadJobs,
  }
}