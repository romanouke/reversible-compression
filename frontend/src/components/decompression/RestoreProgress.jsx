import { CheckCircle, AlertCircle, Loader2, Scissors, ArrowUpDown, Film, Mic, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { ProgressBar } from '../ui/ProgressBar.jsx'

const STAGES = [
  { key: 'split', label: 'Splitting compressed video', icon: Scissors },
  { key: 'restore', label: 'Restoring tube order', icon: ArrowUpDown },
  { key: 'concat', label: 'Concatenating tubes', icon: Film },
  { key: 'mux', label: 'Muxing audio', icon: Mic },
  { key: 'verify', label: 'Verifying integrity', icon: CheckCircle2 },
]

const STAGE_PROGRESS = {
  split: 20,
  restore: 40,
  concat: 70,
  mux: 90,
  verify: 100,
}

export function RestoreProgress({ status, stage, progress, onCancel, md5Match }) {
  const getStageIndex = (stageKey) => STAGES.findIndex((s) => s.key === stageKey)
  const currentStageIndex = stage ? getStageIndex(stage) : 0

  const getStageStatus = (index) => {
    if (status === 'completed') return 'completed'
    if (status === 'failed') return index <= currentStageIndex ? 'failed' : 'pending'
    if (index < currentStageIndex) return 'completed'
    if (index === currentStageIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Restoring</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {status === 'processing' ? `Stage: ${STAGES[currentStageIndex]?.label || 'Processing...'}` : 
             status === 'completed' ? 'Restored successfully' : 
             status === 'failed' ? 'Restoration failed' : 'Queued'}
          </p>
        </div>
        {status === 'processing' && (
          <button
            onClick={onCancel}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Cancel
          </button>
        )}
      </div>

      <ProgressBar
        progress={status === 'completed' ? 100 : progress || STAGE_PROGRESS[stage] || 0}
        status={status === 'processing' ? `${Math.round(progress || STAGE_PROGRESS[stage] || 0)}%` : status}
        variant={status === 'failed' ? 'error' : status === 'completed' ? 'success' : 'default'}
      />

      <div className="space-y-3" role="list" aria-label="Restoration stages">
        {STAGES.map((stageInfo, index) => {
          const stageStatus = getStageStatus(index)
          const Icon = stageInfo.icon
          return (
            <div
              key={stageInfo.key}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                stageStatus === 'current' && 'bg-primary-50 dark:bg-primary-900/20',
                stageStatus === 'completed' && 'bg-green-50 dark:bg-green-900/20',
                stageStatus === 'failed' && index === currentStageIndex && 'bg-red-50 dark:bg-red-900/20'
              )}
              role="listitem"
            >
              <div className={clsx('flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                stageStatus === 'completed' && 'bg-green-500 text-white',
                stageStatus === 'current' && 'bg-primary-500 text-white animate-pulse',
                stageStatus === 'failed' && index === currentStageIndex && 'bg-red-500 text-white',
                stageStatus === 'pending' && 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              )}>
                {stageStatus === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : stageStatus === 'failed' && index === currentStageIndex ? (
                  <AlertCircle className="h-5 w-5" />
                ) : stageStatus === 'current' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium truncate',
                  stageStatus === 'completed' && 'text-green-700 dark:text-green-300',
                  stageStatus === 'current' && 'text-primary-700 dark:text-primary-300',
                  stageStatus === 'failed' && index === currentStageIndex && 'text-red-700 dark:text-red-300',
                  stageStatus === 'pending' && 'text-gray-500 dark:text-gray-400'
                )}>
                  {stageInfo.label}
                </p>
                {stageStatus === 'current' && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>In progress...</span>
                  </div>
                )}
              </div>
              {stageStatus === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )
        })}
      </div>

      {status === 'completed' && md5Match !== undefined && (
        <div className={clsx('p-3 rounded-lg flex items-center gap-3',
          md5Match ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
        )}>
          {md5Match ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Integrity Verified</p>
                <p className="text-sm text-green-600 dark:text-green-400">MD5 hash matches original file (lossless restoration)</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-300">Integrity Check Failed</p>
                <p className="text-sm text-red-600 dark:text-red-400">MD5 hash does not match original file</p>
              </div>
            </>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            Restoration failed. Please verify your compressed video and tube map are valid.
          </p>
        </div>
      )}
    </div>
  )
}