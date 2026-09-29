import { forwardRef } from 'react'
import { clsx } from 'clsx'

export const Card = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100', className)}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = 'Card'

export const CardHeader = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  >
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
))

CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  >
    {children}
  </p>
))

CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
))

CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('flex items-center p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'