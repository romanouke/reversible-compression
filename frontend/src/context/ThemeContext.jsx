import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(undefined)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system'
    }
    return 'system'
  })
  const [resolvedTheme, setResolvedTheme] = useState('light')

  const getResolvedTheme = useCallback((themeValue) => {
    if (themeValue === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return themeValue
  }, [])

  useEffect(() => {
    const resolved = getResolvedTheme(theme)
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme, getResolvedTheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getResolvedTheme('system')
        setResolvedTheme(resolved)
        document.documentElement.classList.toggle('dark', resolved === 'dark')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, getResolvedTheme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }, [])

  const setThemeMode = useCallback((mode) => {
    setTheme(mode)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme: setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}