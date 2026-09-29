import { useState, useRef, useEffect } from 'react'
import { X, Maximize, Minimize, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { clsx } from 'clsx'
import { VideoPlayer } from '../ui/VideoPlayer.jsx'
import { Modal } from '../common/Modal.jsx'

export function ComparisonViewer({ isOpen, onClose, originalSrc, compressedSrc, restoredSrc }) {
  const [syncPlay, setSyncPlay] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const videoRefs = useRef({ original: null, compressed: null, restored: null })

  const handlePlayPause = (playing, source) => {
    if (!syncPlay) return
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      if (key !== source && ref) {
        if (playing) ref.play().catch(() => {})
        else ref.pause()
      }
    })
  }

  const handleSeek = (time, source) => {
    if (!syncPlay) return
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      if (key !== source && ref) {
        ref.currentTime = time
      }
    })
  }

  const handleTimeUpdate = (time, source) => {
    if (!syncPlay) return
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      if (key !== source && ref && Math.abs(ref.currentTime - time) > 0.5) {
        ref.currentTime = time
      }
    })
  }

  const videos = [
    { key: 'original', label: 'Original', src: originalSrc },
    { key: 'compressed', label: 'Compressed', src: compressedSrc },
    { key: 'restored', label: 'Restored', src: restoredSrc },
  ].filter((v) => v.src)

  if (videos.length < 2) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Side-by-Side Comparison"
      className={clsx('max-w-7xl', fullscreen && 'max-w-full')}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={syncPlay}
              onChange={(e) => setSyncPlay(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Sync playback
          </label>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="btn btn-ghost btn-sm"
          >
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {fullscreen ? ' Exit Fullscreen' : ' Fullscreen'}
          </button>
        </div>

        <div className={clsx('grid gap-4', videos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
          {videos.map((video) => (
            <div key={video.key} className="relative">
              <div className="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
                {video.label}
              </div>
              <VideoPlayer
                ref={(el) => { videoRefs.current[video.key] = el }}
                src={video.src}
                className="aspect-video rounded-lg"
                onPlay={() => handlePlayPause(true, video.key)}
                onPause={() => handlePlayPause(false, video.key)}
                onSeek={(time) => handleSeek(time, video.key)}
                onTimeUpdate={(time) => handleTimeUpdate(time, video.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}