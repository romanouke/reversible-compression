import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { clsx } from 'clsx'

const ToastContext = createContext(null)

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800',
  error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800',
}

let toastId = 0
const toasts = []
const listeners = []

function notify() {
  listeners.forEach((listener) => listener([...toasts]))
}

function useToastState() {
  const [toastList, setToastList] = useState(toasts)

  const addToast = useCallback(({ title, description, type = 'info', duration = 5000 }) => {
    const id = ++toastId
    const Icon = toastIcons[type] || Info
    const toast = { id, title, description, type, Icon }
    toasts.push(toast)
    notify()
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
      notify()
    }
  }, [])

  useEffect(() => {
    listeners.push(setToastList)
    return () => {
      const index = listeners.indexOf(setToastList)
      if (index !== -1) listeners.splice(index, 1)
    }
  }, [])

  return { toasts: toastList, addToast, removeToast }
}

export function ToastProvider({ children }) {
  const toastState = useToastState()
  
  return (
    <ToastContext.Provider value={toastState}>
      {children}
      <ToastContainer toasts={toastState.toasts} removeToast={toastState.removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg min-w-[300px] max-w-md animate-slide-up',
            toastStyles[toast.type]
          )}
          role="alert"
        >
          <toast.Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {toast.title && <p className="font-medium">{toast.title}</p>}
            {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}