import { Github, ExternalLink, Shield, Zap, Code, Key, Film, Shuffle, ArrowRight } from 'lucide-react'
import { Button } from '../components/common/Button.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'
import { clsx } from 'clsx'

const techStack = [
  { category: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'React Router v6', 'TanStack Query', 'Framer Motion', 'Lucide React'], color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  { category: 'Backend', items: ['Node.js 20+', 'Express', 'TypeScript', 'FFmpeg', 'ffprobe', 'In-process queue'], color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  { category: 'Infrastructure', items: ['Docker Compose', 'Local filesystem storage'], color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
  { category: 'Algorithms', items: ['Fisher-Yates Shuffle', 'Keyframe-aware Segmentation', 'FFmpeg Segment/Concat', 'Stream-copy verification'], color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
]

const algorithmDetails = [
  {
    title: 'Tube Segmentation',
    description: 'Video is split into fixed-duration tubes (default 1 second) using FFmpeg\'s segment muxer. Splitting occurs at keyframe boundaries to ensure each tube is independently decodable.',
    icon: Film,
  },
  {
    title: 'Deterministic Shuffling',
    description: 'Tubes are shuffled using the Fisher-Yates algorithm with a fixed seed. The same seed always produces the same shuffle order, enabling reproducibility and shared restoration.',
    icon: Shuffle,
  },
  {
    title: 'ID Mapping',
    description: 'Each tube receives a unique sequential ID. A JSON tube map records the original index, shuffled index, and tube ID for each segment. This map is required for restoration.',
    icon: Key,
  },
  {
    title: 'Re-encoding Compression',
    description: 'After shuffling, tubes are concatenated and re-encoded with libx264 (or libx265/VP9). This is where actual compression occurs - reordering alone does not reduce file size.',
    icon: Zap,
  },
  {
    title: 'Lossless Restoration',
    description: 'Stream mode restores packet order and verifies media content. Re-encode mode is lossy and is never described as lossless.',
    icon: Shield,
  },
]

const team = [
  { name: 'RevComp Team', role: 'Core Developers', github: '#' },
]

export function AboutPage() {
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
            About Reversible{' '}
            <span className="text-primary-600 dark:text-primary-400">Compression</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A tube-based video processing tool with deterministic reordering. Stream mode preserves encoded media for lossless restoration; re-encode mode reduces size with quality loss.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" className="btn btn-primary btn-lg" rightIcon={<Github className="h-4 w-4" />}>
              View on GitHub
            </a>
            <a href="#" className="btn btn-outline btn-lg" rightIcon={<ExternalLink className="h-4 w-4" />}>
              Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Concept */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Core Concept</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Understanding how tube-based reversible compression works
          </p>
        </div>
        <div className="space-y-8">
          {algorithmDetails.map((algo, index) => (
            <div key={algo.title} className={clsx('flex gap-8', index % 2 === 1 && 'flex-row-reverse')}>
              <div className={clsx('flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center', algo.icon === Film && 'bg-blue-100 text-blue-600', algo.icon === Shuffle && 'bg-green-100 text-green-600', algo.icon === Key && 'bg-purple-100 text-purple-600', algo.icon === Zap && 'bg-orange-100 text-orange-600', algo.icon === Shield && 'bg-red-100 text-red-600', 'dark:bg-gray-800')}>
                <algo.icon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{algo.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{algo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Compression Pipeline</h2>
        <div className="overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-max px-4">
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2 dark:bg-blue-900/30">
                <Film className="h-10 w-10 text-blue-600" />
              </div>
              <p className="font-medium text-sm">Input Video</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2 dark:bg-green-900/30">
                <Shuffle className="h-10 w-10 text-green-600" />
              </div>
              <p className="font-medium text-sm">Extract Audio</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2 dark:bg-purple-900/30">
                <Film className="h-10 w-10 text-purple-600" />
              </div>
              <p className="font-medium text-sm">Normalize (CFR + Keyframes)</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2 dark:bg-orange-900/30">
                <Shuffle className="h-10 w-10 text-orange-600" />
              </div>
              <p className="font-medium text-sm">Segment into Tubes</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2 dark:bg-red-900/30">
                <Key className="h-10 w-10 text-red-600" />
              </div>
              <p className="font-medium text-sm">Shuffle (Fisher-Yates)</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2 dark:bg-blue-900/30">
                <Film className="h-10 w-10 text-blue-600" />
              </div>
              <p className="font-medium text-sm">Concat Shuffled</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2 dark:bg-green-900/30">
                <Zap className="h-10 w-10 text-green-600" />
              </div>
              <p className="font-medium text-sm">Re-encode (libx264)</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2 dark:bg-purple-900/30">
                <Film className="h-10 w-10 text-purple-600" />
              </div>
              <p className="font-medium text-sm">Mux Audio</p>
            </div>
            <ArrowRight className="text-gray-400 h-6 w-6" />
            <div className="text-center">
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2 dark:bg-gray-800">
                <Shield className="h-10 w-10 text-gray-600" />
              </div>
              <p className="font-medium text-sm">Output + Map + MD5</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Technology Stack</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {techStack.map((tech) => (
            <Card key={tech.category}>
              <CardContent>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{tech.category}</h3>
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Open Source</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Reversible Compression is open source software licensed under the MIT License.
            You are free to use, modify, and distribute it for any purpose.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#" className="btn btn-primary" rightIcon={<Github className="h-4 w-4" />}>
              GitHub Repository
            </a>
            <a href="#" className="btn btn-outline" rightIcon={<ExternalLink className="h-4 w-4" />}>
              MIT License
            </a>
            <a href="#" className="btn btn-outline" rightIcon={<ExternalLink className="h-4 w-4" />}>
              Contributing Guide
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}