import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, ExternalLink, FileCode, Terminal, HelpCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '../components/common/Card.jsx'
import { Button } from '../components/common/Button.jsx'
import { clsx } from 'clsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const apiEndpoints = [
  { method: 'POST', path: '/api/compress', description: 'apiCompress', auth: false },
  { method: 'POST', path: '/api/decompress', description: 'apiDecompress', auth: false },
  { method: 'GET', path: '/api/status/{job_id}', description: 'apiStatus', auth: false },
  { method: 'GET', path: '/api/download/{job_id}/{file_type}', description: 'apiDownload', auth: false },
  { method: 'GET', path: '/api/health', description: 'apiHealth', auth: false },
]

const requestSchemas = {
  compress: `{
  "video": "<multipart/file>",
  "tube_duration_sec": 1.0,
  "shuffle_seed": 42,
  "mode": "stream",
  "output_codec": "libx264",
  "preset": "medium",
  "crf": 23
}`,
  decompress: `{
  "compressed_video": "<multipart/file>",
  "tube_map": "<multipart/file/json>"
}`,
}

const responseSchemas = {
  jobCreated: `{
  "job_id": "uuid",
  "status": "queued"
}`,
  status: `{
  "job_id": "uuid",
  "status": "queued|processing|completed|failed",
  "progress": 65,
  "stage": "split",
  "result": {
    "mode": "stream",
    "lossless": true,
    "compressedVideoUrl": "/api/download/job_id/compressed",
    "tubeMapUrl": "/api/download/job_id/map",
    "restoredVideoUrl": null,
    "originalSize": 104857600,
    "compressedSize": 98765432,
    "tubeMapSize": 24576,
    "restoredSize": null,
    "tubeCount": 120,
    "durationSec": 120.5,
    "md5Original": "...",
    "md5Match": null
  },
  "error": null
}`,
}

const faq = [
  {
    q: 'faqLossless',
    a: 'faqLosslessAnswer'
  },
  {
    q: 'faqFormats',
    a: 'faqFormatsAnswer'
  },
  {
    q: 'faqMaxSize',
    a: 'faqMaxSizeAnswer'
  },
  {
    q: 'faqDuration',
    a: 'faqDurationAnswer'
  },
  {
    q: 'faqDocker',
    a: 'faqDockerAnswer'
  },
  {
    q: 'faqMap',
    a: 'faqMapAnswer'
  },
  {
    q: 'faqAudio',
    a: 'faqAudioAnswer'
  },
  {
    q: 'faqParallel',
    a: 'faqParallelAnswer'
  },
]

const tubeFormatSample = `{
  "tube_id": 0,
  "original_index": 0,
  "shuffled_index": 42,
  "start_time": 0.0,
  "duration": 1.0,
  "keyframe_aligned": true
}`

const tubeMapSchemaSample = `{
  "version": "1.0",
  "created_at": "2026-09-28T08:00:00Z",
  "video_info": {
    "duration": 120.5,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "codec": "h264"
  },
  "tube_duration_sec": 1.0,
  "tube_count": 120,
  "shuffle_seed": 42,
  "tubes": [
    { "tube_id": 0, "original_index": 0, "shuffled_index": 42, "start_time": 0.0, "duration": 1.0 },
    { "tube_id": 1, "original_index": 1, "shuffled_index": 15, "start_time": 1.0, "duration": 1.0 }
  ],
  "md5_original": "d41d8cd98f00b204e9800998ecf8427e"
}`

const shuffleAlgorithmSample = `function fisherYatesShuffle(array, seed) {
  const rng = mulberry32(seed)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}`

const cliUsage = `# Compress a video
python -m app.cli compress input.mp4 \\
  --tube-duration 1.0 \\
  --seed 42 \\
  --codec libx264 \\
  --crf 23 \\
  --output compressed.mp4 \\
  --map tube_map.json

# Decompress a video
python -m app.cli decompress compressed.mp4 tube_map.json \\
  --output restored.mp4

# Verify integrity
python -m app.cli verify original.mp4 restored.mp4`

export function DocsPage() {
  const { t } = useLanguage()
  const [openSections, setOpenSections] = useState(new Set(['api', 'schemas', 'faq']))

  const toggleSection = (section) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const Section = ({ id, title, icon, children }) => (
    <Card className="overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-expanded={openSections.has(id)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {openSections.has(id) ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
      </button>
      {openSections.has(id) && (
        <CardContent className="pt-0">{children}</CardContent>
      )}
    </Card>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('docs.title')}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('docs.subtitle')}
        </p>
      </div>

      {/* API Reference */}
      <Section id="api" title={t('docs.apiReference')} icon={<FileCode className="h-5 w-5" />}>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">{t('docs.method')}</th>
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">{t('docs.endpoint')}</th>
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">{t('docs.description')}</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((ep, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3"><code className={clsx('px-2 py-1 rounded text-xs font-mono', ep.method === 'POST' && 'bg-green-100 text-green-800', ep.method === 'GET' && 'bg-blue-100 text-blue-800', 'dark:bg-gray-800')}>{ep.method}</code></td>
                    <td className="p-3 font-mono text-sm">{ep.path}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{t(`docs.${ep.description}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">{t('docs.compressRequest')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{requestSchemas.compress}</code></pre>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">{t('docs.decompressRequest')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{requestSchemas.decompress}</code></pre>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">{t('docs.jobCreatedResponse')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{responseSchemas.jobCreated}</code></pre>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">{t('docs.statusResponse')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{responseSchemas.status}</code></pre>
        </div>
      </Section>

      {/* Algorithm Spec */}
      <Section id="algorithms" title={t('docs.algorithms')} icon={<Terminal className="h-5 w-5" />}>
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 dark:text-white">{t('docs.tubeFormat')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{tubeFormatSample}</code></pre>

          <h4 className="font-semibold text-gray-900 dark:text-white">{t('docs.tubeMapSchema')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{tubeMapSchemaSample}</code></pre>

          <h4 className="font-semibold text-gray-900 dark:text-white">{t('docs.shuffleAlgorithm')}</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{shuffleAlgorithmSample}</code></pre>
        </div>
      </Section>

      {/* CLI Usage */}
      <Section id="cli" title={t('docs.cli')} icon={<Terminal className="h-5 w-5" />}>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">{t('docs.cliDescription')}</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm"><code>{cliUsage}</code></pre>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" title={t('docs.faq')} icon={<HelpCircle className="h-5 w-5" />}>
        <div className="space-y-4">
          {faq.map((item, i) => (
            <details key={i} className="group border border-gray-200 dark:border-gray-700 rounded-lg">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="font-medium text-gray-900 dark:text-white">{t(`docs.${item.q}`)}</span>
                <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
                {t(`docs.${item.a}`)}
              </div>
            </details>
          ))}
        </div>
      </Section>

      {/* Changelog */}
      <Section id="changelog" title={t('docs.changelog')} icon={<Clock className="h-5 w-5" />}>
        <div className="space-y-4">
          <div className="border-l-2 border-primary-500 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">v1.0.0 (2026-09-28)</h4>
            <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300 list-disc list-inside">
              <li>{t('docs.changeInitial')}</li>
              <li>{t('docs.changeShuffle')}</li>
              <li>{t('docs.changeKeyframes')}</li>
              <li>{t('docs.changeCodecs')}</li>
              <li>{t('docs.changeVerification')}</li>
              <li>{t('docs.changeWeb')}</li>
              <li>{t('docs.changeDocker')}</li>
              <li>{t('docs.changeProgress')}</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  )
}