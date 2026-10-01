import { createContext, useContext, useEffect, useState } from 'react'
import en from '../i18n/en.json'
import id from '../i18n/id.json'

const translations = { en, id }
const LanguageContext = createContext(null)

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem('revcomp-language')
  if (savedLanguage === 'en' || savedLanguage === 'id') return savedLanguage

  try {
    const settings = JSON.parse(localStorage.getItem('revcomp-settings') || '{}')
    if (settings.language === 'en' || settings.language === 'id') return settings.language
  } catch {
    // Ignore malformed settings and use the browser language.
  }

  return navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const setLanguage = (nextLanguage) => {
    if (nextLanguage !== 'en' && nextLanguage !== 'id') return
    localStorage.setItem('revcomp-language', nextLanguage)
    setLanguageState(nextLanguage)
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const t = (key, values = {}) => {
    const value = key.split('.').reduce((current, part) => current?.[part], translations[language])
    if (typeof value !== 'string') return key
    return value.replace(/{{(\w+)}}/g, (_, name) => values[name] ?? `{{${name}}}`)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}