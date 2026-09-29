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

const MODE_OPTIONS = [
  { value: 'stream', label: 'Stream copy (lossless, size unchanged)' },
  { value: 'reencode', label: 'Re-encode (smaller file, not lossless)' },
]

export function ConfigPanel({ config, onChange, className, disabled }) {
  const isStream = config.mode !== 'reencode'

  return (
    <div className={clsx('space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Compression Settings</h3>

      <ConfigSelect
        label="Mode"
        options={MODE_OPTIONS}
        value={config.mode}
        onChange={(e) => onChange('mode', e.target.value)}
        disabled={disabled}
      />
      <p className={clsx(
        '-mt-2 rounded-lg p-3 text-xs',
        isStream
          ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
          : 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
      )}>
        {isStream
          ? 'Every video and audio packet is copied untouched, so the restored file is frame-identical to the original. Reordering alone cannot shrink a file, so expect a ratio near 1.0.'
          : 'The shuffled video is re-encoded, which does shrink the file meaningfully. This is lossy, so the restored frames will not be identical and the lossless check is expected to report a mismatch.'}
      </p>

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
        hint="Target only. Tubes are cut on keyframes, so actual lengths follow the source's GOP layout."
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

      {!isStream && (
        <>
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
        </>
      )}
    </div>
  )
}