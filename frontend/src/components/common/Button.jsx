import { forwardRef } from 'react'
import { clsx } from 'clsx'

export const Button = forwardRef(({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500 dark:border-gray-600 dark:hover:bg-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500 dark:hover:bg-gray-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  }

  return (
    <button
      ref={ref}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'