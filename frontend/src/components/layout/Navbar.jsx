import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, Monitor, Globe } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext.jsx'

const navigation = [
  { name: 'Compress', href: '/compress' },
  { name: 'Decompress', href: '/decompress' },
  { name: 'History', href: '/history' },
  { name: 'About', href: '/about' },
  { name: 'Docs', href: '/docs' },
  { name: 'Settings', href: '/settings' },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme, resolvedTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="4,12 20,12" />
              <polyline points="4,8 20,8" />
            </svg>
            <span>RevComp</span>
          </NavLink>

          <div className="hidden md:flex md:gap-6">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <select
              className="input py-1.5 text-xs"
              defaultValue="en"
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="id">ID</option>
            </select>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="px-4 py-3 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}