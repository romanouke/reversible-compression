import { clsx } from 'clsx'

export function ProgressBar({ progress = 0, status = '', variant = 'default', className, showLabel = true }) {
  const variants = {
    default: 'bg-primary-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && status && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{status}</span>}
        {showLabel && <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>}
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            variants[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={status}
        />
      </div>
    </div>
  )
}