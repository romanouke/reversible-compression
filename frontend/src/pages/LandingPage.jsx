import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Code, Download, Upload, Shuffle, Film, Key, Github, ExternalLink } from 'lucide-react'
import { Button } from '../components/common/Button.jsx'
import { Card, CardContent } from '../components/common/Card.jsx'

const features = [
  {
    icon: Shuffle,
    title: 'Tube-based Reordering',
    description: 'Split video into configurable tubes, shuffle with deterministic Fisher-Yates algorithm, and restore losslessly.',
  },
  {
    icon: Film,
    title: 'Actual Compression',
    description: 'Re-encode with modern codecs (H.264/HEVC) after reordering for real file size reduction.',
  },
  {
    icon: Shield,
    title: 'Lossless Guarantee',
    description: 'MD5 verification ensures bit-for-bit identical restoration. Every round-trip is mathematically verified.',
  },
  {
    icon: Key,
    title: 'Deterministic & Reproducible',
    description: 'Same seed = same shuffle. Share seed + tube map to allow anyone to restore.',
  },
  {
    icon: Code,
    title: 'Open Source',
    description: 'Built with React, FastAPI, FFmpeg. Full algorithm transparency, self-hostable with Docker.',
  },
  {
    icon: Download,
    title: 'Local-First',
    description: 'No cloud upload required. All processing happens on your machine or local server.',
  },
]

const steps = [
  { number: '01', title: 'Upload & Configure', description: 'Select video, set tube duration (default 1s), shuffle seed, and codec/CRF.' },
  { number: '02', title: 'Compress', description: 'Video splits into keyframe-aligned tubes → shuffled → re-encoded with FFmpeg → compressed output + tube map.' },
  { number: '03', title: 'Decompress', description: 'Upload compressed video + tube map → tubes restored to original order → concatenated → audio muxed → verified.' },
]

export function LandingPage() {
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
              Reversible Video{' '}
              <span className="text-primary-600 dark:text-primary-400">Compression</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tube-based reordering with deterministic shuffling and actual codec compression.
              Lossless restoration guaranteed via MD5 verification.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/compress">
                <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Try Compression
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  How It Works
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400">
                <Github className="h-5 w-5" />
                View on GitHub
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400">
                <ExternalLink className="h-5 w-5" />
                Documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three simple steps to compress and restore your videos with mathematical guarantees.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 text-6xl font-bold text-primary-100 dark:text-primary-900/30">
                  {step.number}
                </div>
                <CardContent className="relative">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{step.description}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Key Features</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for developers and researchers who need transparent, verifiable video compression.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent>
                  <div className="mb-4 rounded-lg bg-primary-100 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 w-fit">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{feature.description}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Tech Stack</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frontend</h3>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'Vite', 'Tailwind CSS', 'React Router', 'TanStack Query', 'Framer Motion', 'Lucide React'].map((tech) => (
                    <span key={tech} className="badge badge-info">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Backend</h3>
                <div className="flex flex-wrap gap-2">
                  {['FastAPI', 'FFmpeg', 'OpenCV', 'Redis/Arq', 'Pydantic', 'Uvicorn', 'Python 3.11+'].map((tech) => (
                    <span key={tech} className="badge badge-warning">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Infrastructure</h3>
                <div className="flex flex-wrap gap-2">
                  {['Docker Compose', 'Nginx (prod)', 'Prometheus', 'Grafana', 'GitHub Actions'].map((tech) => (
                    <span key={tech} className="badge">{tech}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Algorithms</h3>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Try?</h2>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            Start compressing videos with reversible tube-based reordering. Open source, self-hosted, and mathematically verified.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/compress">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Compressing
              </Button>
            </Link>
            <Link to="/docs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}