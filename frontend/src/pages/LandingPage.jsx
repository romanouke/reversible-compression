import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Code, Download, Upload, Shuffle, Film, Key, Github, ExternalLink } from 'lucide-react'
import { Button } from '../components/common/Button.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const features = [
  {
    icon: Shuffle,
    title: 'reordering',
    description: 'reorderingDesc',
  },
  {
    icon: Film,
    title: 'compression',
    description: 'compressionDesc',
  },
  {
    icon: Shield,
    title: 'lossless',
    description: 'losslessDesc',
  },
  {
    icon: Key,
    title: 'deterministic',
    description: 'deterministicDesc',
  },
  {
    icon: Code,
    title: 'openSource',
    description: 'openSourceDesc',
  },
  {
    icon: Download,
    title: 'localFirst',
    description: 'localFirstDesc',
  },
]

const steps = [
  { number: '01', title: 'step1', description: 'step1Desc' },
  { number: '02', title: 'step2', description: 'step2Desc' },
  { number: '03', title: 'step3', description: 'step3Desc' },
]

export function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <svg className="h-12 w-12 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="4,12 20,12" />
                <polyline points="4,8 20,8" />
              </svg>
              <span className="text-4xl font-bold text-gray-900 dark:text-white">RevComp</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('landing.hero.title')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/compress">
                <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {t('landing.hero.cta')}
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t('landing.hero.learnMore')}
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400">
                <Github className="h-5 w-5" />
                {t('landing.githubLabel')}
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400">
                <ExternalLink className="h-5 w-5" />
                {t('nav.docs')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('landing.howItWorks.title')}</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('landing.howItWorks.intro')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 text-6xl font-bold text-primary-100 dark:text-primary-900/30">
                  {step.number}
                </div>
                <CardContent className="relative">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t(`landing.howItWorks.${step.title}`)}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{t(`landing.howItWorks.${step.description}`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('landing.keyFeatures')}</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('landing.keyFeaturesDesc')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent>
                  <div className="mb-4 rounded-lg bg-primary-100 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 w-fit">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t(`landing.features.${feature.title}`)}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{t(`landing.features.${feature.description}`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('landing.techStack')}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('about.frontend')}</h3>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'Vite', 'Tailwind CSS', 'React Router', 'TanStack Query', 'Framer Motion', 'Lucide React'].map((tech) => (
                    <span key={tech} className="badge badge-info">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('about.backend')}</h3>
                <div className="flex flex-wrap gap-2">
                  {['Node.js 20+', 'Express', 'TypeScript', 'FFmpeg', 'ffprobe', 'In-process queue'].map((tech) => (
                    <span key={tech} className="badge badge-warning">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('about.infrastructure')}</h3>
                <div className="flex flex-wrap gap-2">
                  {['Docker Compose', 'Nginx (prod)', 'Prometheus', 'Grafana', 'GitHub Actions'].map((tech) => (
                    <span key={tech} className="badge">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('about.algorithms')}</h3>
                <div className="flex flex-wrap gap-2">
                  {['Fisher-Yates Shuffle', 'Keyframe-aware Segmentation', 'FFmpeg Segment/Concat', 'libx264/libx265', 'MD5 Verification'].map((tech) => (
                    <span key={tech} className="badge badge-success">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 dark:bg-primary-700">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.ready')}</h2>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            {t('landing.readyDesc')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/compress">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {t('landing.startCompressing')}
              </Button>
            </Link>
            <Link to="/docs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                {t('landing.readDocs')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}