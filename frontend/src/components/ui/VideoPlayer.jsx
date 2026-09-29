import { forwardRef, useRef, useState, useCallback, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'

export const VideoPlayer = forwardRef(({ src, poster, className, onError, onLoad, ...props }, ref) => {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef(null)

  const forwardedRef = useCallback((node) => {
    videoRef.current = node
    if (ref) {
      if (typeof ref === 'function') ref(node)
      else ref.current = node
    }
  }, [ref])

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause()
      else videoRef.current.play()
      setPlaying(!playing)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      if (onLoad) onLoad(videoRef.current.duration)
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    if (videoRef.current) videoRef.current.currentTime = 0
  }

  const handleSeek = (e) => {
    if (videoRef.current) {
      videoRef.current.currentTime = e.target.value
    }
  }

  const handleVolumeChange = (e) => {
    const vol = e.target.value
    if (videoRef.current) {
      videoRef.current.volume = vol
      setVolume(vol)
      setMuted(vol === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  const toggleFullscreen = async () => {
    if (videoRef.current) {
      if (!fullscreen) {
        try {
          await videoRef.current.requestFullscreen()
          setFullscreen(true)
        } catch (err) {
          console.error('Fullscreen error:', err)
        }
      } else {
        try {
          await document.exitFullscreen()
          setFullscreen(false)
        } catch (err) {
          console.error('Exit fullscreen error:', err)
        }
      }
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('ended', handleEnded)
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('ended', handleEnded)
      }
    }
  }, [])

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={forwardedRef}
      className={clsx('relative w-full bg-black rounded-lg overflow-hidden', className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-auto block"
        onError={onError}
        playsInline
        {...props}
      />
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-white">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10) }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label="Rewind 10s"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              aria-label="Seek"
            />
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10) }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label="Forward 10s"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            <span className="text-xs font-mono w-20 text-right">{formatTime(currentTime)}</span>
            <span className="text-xs font-mono text-gray-300 w-20">{formatTime(duration)}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                aria-label="Volume"
              />
            </div>
            <select
              value={videoRef.current?.playbackRate || 1}
              onChange={(e) => { if (videoRef.current) videoRef.current.playbackRate = parseFloat(e.target.value) }}
              className="ml-auto px-2 py-1 text-xs bg-white/10 rounded text-white border-0 focus:outline-none focus:ring-1 focus:ring-white"
              aria-label="Playback speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'