import { useState, useEffect } from 'react'
import { Save, HardDrive, Palette, Globe, Shield, Cpu, Trash2, Download, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card.jsx'
import { Button } from '../components/common/Button.jsx'
import { ConfigInput, ConfigSelect } from '../components/ui/ConfigSelect.jsx'
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx'
import { useToast } from '../components/ui/ToastContainer.jsx'
import { clsx } from 'clsx'

const CODEC_OPTIONS = [
  { value: 'libx264', label: 'H.264 (libx264)' },
  { value: 'libx265', label: 'HEVC/H.265 (libx265)' },
  { value: 'libvpx-vp9', label: 'VP9 (libvpx-vp9)' },
  { value: 'mpeg4', label: 'MPEG-4 (mpeg4)' },
]

const PRESET_OPTIONS = [
  { value: 'ultrafast', label: 'Ultrafast (fastest, larger file)' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Veryfast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium (default)' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Veryslow (slowest, smallest file)' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
]

const DEFAULT_SETTINGS = {
  tubeDurationSec: 1.0,
  shuffleSeed: 42,
  outputCodec: 'libx264',
  preset: 'medium',
  crf: 23,
  targetFps: 30,
  theme: 'system',
  language: 'en',
  ffmpegPath: '/usr/bin/ffmpeg',
  ffprobePath: '/usr/bin/ffprobe',
  maxConcurrentJobs: 2,
  logLevel: 'INFO',
  jobTtlHours: 24,
}

export function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, tempCount: 0 })
  const { addToast } = useToast()

  useEffect(() => {
    loadSettings()
    loadStorageInfo()
  }, [])

  const loadSettings = () => {
    const saved = localStorage.getItem('revcomp-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }
  }

  const loadStorageInfo = async () => {
    try {
      // In real app, call API endpoint
      // For now, simulate
      setStorageInfo({ used: 2.4 * 1024 * 1024 * 1024, total: 50 * 1024 * 1024 * 1024, tempCount: 3 })
    } catch (e) {
      console.error('Failed to load storage info:', e)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('revcomp-settings', JSON.stringify(settings))
      // In real app, also save to backend via API
      await new Promise(r => setTimeout(r, 500))
      addToast({ title: 'Settings saved', type: 'success' })
    } catch (error) {
      addToast({ title: 'Save failed', description: error.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS)
      localStorage.removeItem('revcomp-settings')
      addToast({ title: 'Settings reset', type: 'success' })
    }
  }

  const handleClearHistory = async () => {
    if (confirm('Delete all history from IndexedDB? This cannot be undone.')) {
      try {
        // In real app, call API
        addToast({ title: 'History cleared', type: 'success' })
      } catch (error) {
        addToast({ title: 'Failed to clear history', description: error.message, type: 'error' })
      }
    }
  }

  const handleClearTemp = async () => {
    if (confirm('Delete all temporary files? This may affect running jobs.')) {
      try {
        // In real app, call API
        loadStorageInfo()
        addToast({ title: 'Temp files cleared', type: 'success' })
      } catch (error) {
        addToast({ title: 'Failed to clear temp', description: error.message, type: 'error' })
      }
    }
  }

  const handleExportSettings = () => {
    const data = JSON.stringify(settings, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revcomp-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result)
        setSettings(prev => ({ ...prev, ...imported }))
        localStorage.setItem('revcomp-settings', JSON.stringify({ ...settings, ...imported }))
        addToast({ title: 'Settings imported', type: 'success' })
      } catch (err) {
        addToast({ title: 'Import failed', description: 'Invalid JSON file', type: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure default compression settings, appearance, and storage management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings} leftIcon={<Download className="h-4 w-4" />}>
            Export Settings
          </Button>
          <Button variant="outline" onClick={handleReset} leftIcon={<Trash2 className="h-4 w-4" />}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} leftIcon={<Save className="h-4 w-4" />}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Defaults */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Compression Settings</CardTitle>
              <CardDescription>These values are used as defaults when creating new compression jobs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ConfigInput
                  label="Tube Duration (seconds)"
                  type="number"
                  min="0.1"
                  max="60"
                  step="0.1"
                  value={settings.tubeDurationSec}
                  onChange={(e) => setSettings(prev => ({ ...prev, tubeDurationSec: parseFloat(e.target.value) || 1.0 }))}
                />
                <ConfigInput
                  label="Shuffle Seed"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  value={settings.shuffleSeed}
                  onChange={(e) => setSettings(prev => ({ ...prev, shuffleSeed: parseInt(e.target.value) || 42 }))}
                />
                <ConfigSelect
                  label="Output Codec"
                  options={CODEC_OPTIONS}
                  value={settings.outputCodec}
                  onChange={(e) => setSettings(prev => ({ ...prev, outputCodec: e.target.value }))}
                />
                <ConfigSelect
                  label="Encoding Preset"
                  options={PRESET_OPTIONS}
                  value={settings.preset}
                  onChange={(e) => setSettings(prev => ({ ...prev, preset: e.target.value }))}
                />
                <ConfigInput
                  label="CRF (Quality 0-51, lower = better)"
                  type="number"
                  min="0"
                  max="51"
                  step="1"
                  value={settings.crf}
                  onChange={(e) => setSettings(prev => ({ ...prev, crf: parseInt(e.target.value) || 23 }))}
                />
                <ConfigInput
                  label="Target FPS"
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={settings.targetFps}
                  onChange={(e) => setSettings(prev => ({ ...prev, targetFps: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Backend Settings</CardTitle>
              <CardDescription>These settings require backend restart to take effect.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ConfigInput
                  label="FFmpeg Path"
                  type="text"
                  value={settings.ffmpegPath}
                  onChange={(e) => setSettings(prev => ({ ...prev, ffmpegPath: e.target.value }))}
                />
                <ConfigInput
                  label="FFprobe Path"
                  type="text"
                  value={settings.ffprobePath}
                  onChange={(e) => setSettings(prev => ({ ...prev, ffprobePath: e.target.value }))}
                />
                <ConfigInput
                  label="Max Concurrent Jobs"
                  type="number"
                  min="1"
                  max="16"
                  step="1"
                  value={settings.maxConcurrentJobs}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrentJobs: parseInt(e.target.value) || 2 }))}
                />
                <ConfigSelect
                  label="Log Level"
                  options={[
                    { value: 'DEBUG', label: 'Debug' },
                    { value: 'INFO', label: 'Info' },
                    { value: 'WARNING', label: 'Warning' },
                    { value: 'ERROR', label: 'Error' },
                  ]}
                  value={settings.logLevel}
                  onChange={(e) => setSettings(prev => ({ ...prev, logLevel: e.target.value }))}
                />
                <ConfigInput
                  label="Job TTL (hours)"
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  value={settings.jobTtlHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, jobTtlHours: parseInt(e.target.value) || 24 }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeToggle />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Theme preference is saved locally and synced across sessions.
              </p>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigSelect
                label="Interface Language"
                options={LANGUAGE_OPTIONS}
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                More languages coming soon. <a href="#" className="text-primary-600 hover:underline">Contribute translations</a>.
              </p>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Used Space</span>
                  <span className="font-medium">{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Temp Jobs</span>
                  <span className="font-medium">{storageInfo.tempCount} active</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleClearHistory} leftIcon={<Trash2 className="h-4 w-4" />} className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
                  Clear History
                </Button>
                <Button variant="outline" onClick={handleClearTemp} leftIcon={<Trash2 className="h-4 w-4" />} className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20">
                  Clear Temp Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export your settings to a JSON file for backup or sharing. Import to restore on another machine.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportSettings} leftIcon={<Download className="h-4 w-4" />}>
                  Export Settings
                </Button>
                <label className="btn btn-outline cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                  <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}