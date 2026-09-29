import { ConfigInput, ConfigSelect } from '../ui/ConfigSelect.jsx'
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

export function ConfigPanel({ config, onChange, className, disabled }) {
  return (
    <div className={clsx('space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Compression Settings</h3>
      
      <ConfigInput
        label="Tube Duration (seconds)"
        type="number"
        min="0.1"
        max="60"
        step="0.1"
        value={config.tubeDurationSec}
        onChange={(e) => onChange('tubeDurationSec', parseFloat(e.target.value) || 1.0)}
        disabled={disabled}
        error={config.tubeDurationSec < 0.1 || config.tubeDurationSec > 60 ? 'Must be between 0.1 and 60' : undefined}
      />

      <ConfigInput
        label="Shuffle Seed"
        type="number"
        min="0"
        max="2147483647"
        step="1"
        value={config.shuffleSeed}
        onChange={(e) => onChange('shuffleSeed', parseInt(e.target.value) || 42)}
        disabled={disabled}
      />

      <ConfigSelect
        label="Output Codec"
        options={CODEC_OPTIONS}
        value={config.outputCodec}
        onChange={(e) => onChange('outputCodec', e.target.value)}
        disabled={disabled}
      />

      <ConfigSelect
        label="Encoding Preset"
        options={PRESET_OPTIONS}
        value={config.preset}
        onChange={(e) => onChange('preset', e.target.value)}
        disabled={disabled}
      />

      <ConfigInput
        label="CRF (Quality 0-51, lower = better)"
        type="number"
        min="0"
        max="51"
        step="1"
        value={config.crf}
        onChange={(e) => onChange('crf', parseInt(e.target.value) || 23)}
        disabled={disabled}
        error={config.crf < 0 || config.crf > 51 ? 'Must be between 0 and 51' : undefined}
      />

      <ConfigInput
        label="Target FPS"
        type="number"
        min="1"
        max="120"
        step="1"
        value={config.targetFps}
        onChange={(e) => onChange('targetFps', parseInt(e.target.value) || 30)}
        disabled={disabled}
      />
    </div>
  )
}