import { Github, Link as LinkIcon } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('common.footerCopyright', { year: new Date().getFullYear() })}
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={t('nav.docs')}
            >
              <LinkIcon className="h-5 w-5" />
            </a>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            v1.0.0
          </p>
        </div>
      </div>
    </footer>
  )
}