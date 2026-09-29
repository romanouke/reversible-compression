import { forwardRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { createPortal } from 'react-dom'

export const Modal = forwardRef(({ isOpen, onClose, title, description, children, className, ...props }, ref) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = 'unset' }
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} aria-describedby={description ? 'modal-description' : undefined}>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={clsx('relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800', className)}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {title && <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>}
        {description && <p id="modal-description" className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
})

Modal.displayName = 'Modal'