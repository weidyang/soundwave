import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1 } from 'lucide-react'
import { useRadioStore } from '../../stores/radio-store'
import { useMusicStore } from '../../stores/music-store'

export function PlaybackControls() {
  const { isPlaying, togglePlay, volume, setVolume, isMuted, toggleMute } = useRadioStore()
  const { playlist, currentTrackIndex, setCurrentTrackIndex } = useMusicStore()

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.4 ? Volume1 : Volume2

  const handlePrev = () => {
    if (playlist.length === 0 || currentTrackIndex <= 0) return
    setCurrentTrackIndex(currentTrackIndex - 1)
  }

  const handleNext = () => {
    if (playlist.length === 0 || currentTrackIndex >= playlist.length - 1) return
    setCurrentTrackIndex(currentTrackIndex + 1)
  }

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="w-28" />

      <div className="flex-1 flex items-center justify-center gap-5">
        <button onClick={handlePrev} className="skip-btn">
          <SkipBack className="w-4 h-4" />
        </button>

        <button onClick={togglePlay} className="play-btn">
          {isPlaying ?
            <Pause className="w-5 h-5" fill="currentColor" /> :
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          }
        </button>

        <button onClick={handleNext} className="skip-btn">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="w-28 flex items-center gap-2 overflow-hidden">
        <button
          onClick={toggleMute}
          className="text-[var(--text-dim)] hover:text-[var(--accent-cyan)] transition-colors flex-shrink-0"
        >
          <VolumeIcon className="w-4 h-4" />
        </button>
        <input
          type="range" min="0" max="1" step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="volume-slider flex-1 min-w-0"
        />
      </div>
    </div>
  )
}
