import { ConfigInput, ConfigSelect } from '../ui/ConfigSelect.jsx'
import { clsx } from 'clsx'
import { useLanguage } from '../../context/LanguageContext.jsx'

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
  const { t } = useLanguage()
  const isStream = config.mode !== 'reencode'
  const modeOptions = [
    { value: 'stream', label: t('compress.streamMode') },
    { value: 'reencode', label: t('compress.reencodeMode') },
  ]

  return (
    <div className={clsx('space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('compress.settings')}</h3>

      <ConfigSelect
        label={t('compress.mode')}
        options={modeOptions}
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
          ? t('compress.streamModeDesc')
          : t('compress.reencodeModeDesc')}
      </p>

      <ConfigInput
        label={t('compress.tubeDuration')}
        type="number"
        min="0.1"
        max="60"
        step="0.1"
        value={config.tubeDurationSec}
        onChange={(e) => onChange('tubeDurationSec', parseFloat(e.target.value) || 1.0)}
        disabled={disabled}
        error={config.tubeDurationSec < 0.1 || config.tubeDurationSec > 60 ? t('compress.durationRangeError') : undefined}
        hint={t('compress.tubeDurationHint')}
      />

      <ConfigInput
        label={t('compress.shuffleSeed')}
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
            label={t('compress.outputCodec')}
            options={CODEC_OPTIONS}
            value={config.outputCodec}
            onChange={(e) => onChange('outputCodec', e.target.value)}
            disabled={disabled}
          />

          <ConfigSelect
            label={t('compress.encodingPreset')}
            options={PRESET_OPTIONS}
            value={config.preset}
            onChange={(e) => onChange('preset', e.target.value)}
            disabled={disabled}
          />

          <ConfigInput
            label={t('compress.crf')}
            type="number"
            min="0"
            max="51"
            step="1"
            value={config.crf}
            onChange={(e) => onChange('crf', parseInt(e.target.value) || 23)}
            disabled={disabled}
            error={config.crf < 0 || config.crf > 51 ? t('compress.crfRangeError') : undefined}
          />
        </>
      )}
    </div>
  )
}