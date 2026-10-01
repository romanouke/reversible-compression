import { Github, ExternalLink, Shield, Zap, Code, Key, Film, Shuffle, ArrowRight } from 'lucide-react'
import { Button } from '../components/common/Button.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'
import { clsx } from 'clsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const techStack = [
  { category: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'React Router v6', 'TanStack Query', 'Framer Motion', 'Lucide React'], color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  { category: 'Backend', items: ['Node.js 20+', 'Express', 'TypeScript', 'FFmpeg', 'ffprobe', 'In-process queue'], color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  { category: 'Infrastructure', items: ['Docker Compose', 'Local filesystem storage'], color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
  { category: 'Algorithms', items: ['Fisher-Yates Shuffle', 'Keyframe-aware Segmentation', 'FFmpeg Segment/Concat', 'Stream-copy verification'], color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
]

const algorithmDetails = [
  {
    title: 'tubeSegmentation',
    description: 'tubeSegmentationDesc',
    icon: Film,
  },
  {
    title: 'deterministicShuffling',
    description: 'deterministicShufflingDesc',
    icon: Shuffle,
  },
  {
    title: 'idMapping',
    description: 'idMappingDesc',
    icon: Key,
  },
  {
    title: 'reencodingCompression',
    description: 'reencodingCompressionDesc',
    icon: Zap,
  },
  {
    title: 'losslessRestoration',
    description: 'losslessRestorationDesc',
    icon: Shield,
  },
]

const team = [
  { name: 'RevComp Team', role: 'Core Developers', github: '#' },
]

export function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-20">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg className="h-16 w-16 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="4,12 20,12" />
              <polyline points="4,8 20,8" />
            </svg>
            <span className="text-5xl font-bold text-gray-900 dark:text-white">RevComp</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('about.title')}
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('about.description')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" className="btn btn-primary btn-lg" rightIcon={<Github className="h-4 w-4" />}>
              {t('about.github')}
            </a>
            <a href="#" className="btn btn-outline btn-lg" rightIcon={<ExternalLink className="h-4 w-4" />}>
              {t('nav.docs')}
            </a>
          </div>
        </div>
      </section>

      {/* Concept */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('about.concept')}</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('about.conceptDesc')}
          </p>
        </div>
        <div className="space-y-8">
          {algorithmDetails.map((algo, index) => (
            <div key={algo.title} className={clsx('flex gap-8', index % 2 === 1 && 'flex-row-reverse')}>
              <div className={clsx('flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center', algo.icon === Film && 'bg-blue-100 text-blue-600', algo.icon === Shuffle && 'bg-green-100 text-green-600', algo.icon === Key && 'bg-purple-100 text-purple-600', algo.icon === Zap && 'bg-orange-100 text-orange-600', algo.icon === Shield && 'bg-red-100 text-red-600', 'dark:bg-gray-800')}>
                <algo.icon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t(`about.${algo.title}`)}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{t(`about.${algo.description}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">{t('about.pipeline')}</h2>
        <div className="overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-max px-4">
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2 dark:bg-blue-900/30">
                <Film className="h-10 w-10 text-blue-600" />
              </div>
              <p className="font-medium text-sm">{t('about.inputVideo')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2 dark:bg-green-900/30">
                <Shuffle className="h-10 w-10 text-green-600" />
              </div>
              <p className="font-medium text-sm">{t('about.extractAudio')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2 dark:bg-purple-900/30">
                <Film className="h-10 w-10 text-purple-600" />
              </div>
              <p className="font-medium text-sm">{t('about.normalize')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2 dark:bg-orange-900/30">
                <Shuffle className="h-10 w-10 text-orange-600" />
              </div>
              <p className="font-medium text-sm">{t('about.segmentTubes')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2 dark:bg-red-900/30">
                <Key className="h-10 w-10 text-red-600" />
              </div>
              <p className="font-medium text-sm">{t('about.shuffle')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2 dark:bg-blue-900/30">
                <Film className="h-10 w-10 text-blue-600" />
              </div>
              <p className="font-medium text-sm">{t('about.concatShuffled')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2 dark:bg-green-900/30">
                <Zap className="h-10 w-10 text-green-600" />
              </div>
              <p className="font-medium text-sm">{t('about.reencode')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2 dark:bg-purple-900/30">
                <Film className="h-10 w-10 text-purple-600" />
              </div>
              <p className="font-medium text-sm">{t('about.muxAudio')}</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2 dark:bg-gray-800">
                <Shield className="h-10 w-10 text-gray-600" />
              </div>
              <p className="font-medium text-sm">{t('about.outputMap')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('about.techStack')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {techStack.map((tech) => (
            <Card key={tech.category}>
              <CardContent>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t(`about.${tech.category.toLowerCase()}`)}</h3>
                <div className="flex flex-wrap gap-2">
                  {tech.items.map((item) => (
                    <span key={item} className={clsx('badge', tech.color)}>{item}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* License */}
      <section className="text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('about.openSource')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('about.licenseDesc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#" className="btn btn-primary" rightIcon={<Github className="h-4 w-4" />}>
              {t('about.github')}
            </a>
            <a href="#" className="btn btn-outline" rightIcon={<ExternalLink className="h-4 w-4" />}>
              {t('about.license')}
            </a>
            <a href="#" className="btn btn-outline" rightIcon={<ExternalLink className="h-4 w-4" />}>
              {t('about.contributing')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}