import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { clsx } from 'clsx'

export function ThemeToggle({ className }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <div className={clsx('flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800', className)}>
      {['light', 'dark', 'system'].map((mode) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className={clsx(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            theme === mode
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          )}
          aria-pressed={theme === mode}
        >
          {mode === 'light' && <Sun className="h-4 w-4" />}
          {mode === 'dark' && <Moon className="h-4 w-4" />}
          {mode === 'system' && <Monitor className="h-4 w-4" />}
          <span className="hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
        </button>
      ))}
    </div>
  )
}