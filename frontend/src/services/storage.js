import { openDB } from 'idb'

const DB_NAME = 'revcomp-history'
const DB_VERSION = 1
const STORE_NAME = 'jobs'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'jobId' })
          store.createIndex('createdAt', 'createdAt')
          store.createIndex('type', 'type')
          store.createIndex('status', 'status')
        }
      },
    })
  }
  return dbPromise
}

export async function saveJob(job) {
  const db = await getDB()
  const jobWithTimestamp = {
    ...job,
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await db.put(STORE_NAME, jobWithTimestamp)
  return jobWithTimestamp
}

export async function getJob(jobId) {
  const db = await getDB()
  return db.get(STORE_NAME, jobId)
}

export async function getAllJobs() {
  const db = await getDB()
  return db.getAllFromIndex(STORE_NAME, 'createdAt')
}

export async function getJobsByType(type) {
  const db = await getDB()
  return db.getAllFromIndex(STORE_NAME, 'type', type)
}

export async function getJobsByStatus(status) {
  const db = await getDB()
  return db.getAllFromIndex(STORE_NAME, 'status', status)
}

export async function deleteJob(jobId) {
  const db = await getDB()
  await db.delete(STORE_NAME, jobId)
}

export async function clearAllJobs() {
  const db = await getDB()
  await db.clear(STORE_NAME)
}

export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      total: estimate.quota || 0,
    }
  }
  return { used: 0, total: 0 }
}

// Migration from localStorage
export async function migrateFromLocalStorage() {
  const stored = localStorage.getItem('revcomp-history')
  if (stored) {
    try {
      const jobs = JSON.parse(stored)
      for (const job of jobs) {
        await saveJob(job)
      }
      localStorage.removeItem('revcomp-history')
      return jobs.length
    } catch (e) {
      console.error('Migration failed:', e)
      return 0
    }
  }
  return 0
}