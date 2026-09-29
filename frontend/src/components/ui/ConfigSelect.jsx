import { forwardRef } from 'react'
import { clsx } from 'clsx'

export const ConfigSelect = forwardRef(({ label, options, className, error, ...props }, ref) => (
  <div className={clsx('w-full', className)}>
    {label && <label className="label">{label}</label>}
    <select
      ref={ref}
      className={clsx('input', error && 'border-red-500 focus:ring-red-500')}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
))

ConfigSelect.displayName = 'ConfigSelect'

export const ConfigInput = forwardRef(({ label, type = 'number', className, error, ...props }, ref) => (
  <div className={clsx('w-full', className)}>
    {label && <label className="label">{label}</label>}
    <input
      ref={ref}
      type={type}
      className={clsx('input', error && 'border-red-500 focus:ring-red-500')}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
))

ConfigInput.displayName = 'ConfigInput'