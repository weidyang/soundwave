import { useState, useEffect } from 'react'
import { useMusicStore } from '../../stores/music-store'
import { Loader2, Radio, Sparkles } from 'lucide-react'

interface RadioMode {
  id: string
  name: string
  icon: string
  color: string
}

interface RadioModes {
  moods: RadioMode[]
  genres: RadioMode[]
  charts: RadioMode[]
}

interface Props {
  onTracksLoaded: (tracks: any[]) => void
}

type Category = 'mood' | 'genre' | 'chart' | 'smart'

export function RadioModeSelector({ onTracksLoaded }: Props) {
  const [modes, setModes] = useState<RadioModes | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category>('mood')
  const [loading, setLoading] = useState<string | null>(null)
  const currentTrack = useMusicStore(s => s.getCurrentTrack())

  useEffect(() => {
    window.electronAPI.getRadioModes().then(setModes)
  }, [])

  const handleSelect = async (category: Category, id: string) => {
    setLoading(id)
    try {
      let tracks: any[] = []
      if (category === 'mood') tracks = await window.electronAPI.getRadioMoodTracks(id)
      else if (category === 'genre') tracks = await window.electronAPI.getRadioGenreTracks(id)
      else if (category === 'chart') tracks = await window.electronAPI.getRadioChartTracks(id)
      if (tracks.length > 0) onTracksLoaded(tracks)
    } finally {
      setLoading(null)
    }
  }

  const handleSmart = async () => {
    setLoading('smart')
    try {
      const tracks = await window.electronAPI.getRadioSmartTracks(currentTrack)
      if (tracks.length > 0) onTracksLoaded(tracks)
    } finally {
      setLoading(null)
    }
  }

  if (!modes) return null

  const categories: { id: Category; label: string }[] = [
    { id: 'mood', label: '心情' },
    { id: 'genre', label: '风格' },
    { id: 'chart', label: '榜单' },
    { id: 'smart', label: '猜你喜欢' },
  ]

  const currentModes: RadioMode[] =
    activeCategory === 'mood' ? modes.moods :
    activeCategory === 'genre' ? modes.genres :
    activeCategory === 'chart' ? modes.charts : []

  return (
    <div className="space-y-2.5">
      {/* Category tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] border border-[var(--accent-amber)]/25'
                : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-color)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Smart radio (special) */}
      {activeCategory === 'smart' ? (
        <button
          onClick={handleSmart}
          disabled={loading === 'smart'}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-cyan)]/5 to-[var(--accent-amber)]/5 hover:from-[var(--accent-cyan)]/10 hover:to-[var(--accent-amber)]/10 transition-all group"
        >
          {loading === 'smart' ? (
            <Loader2 className="w-8 h-8 text-[var(--accent-cyan)] animate-spin flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-amber)] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[var(--bg-primary)]" />
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-medium">智能推荐电台</p>
            <p className="text-[10px] text-[var(--text-dim)]">
              {currentTrack
                ? `根据「${currentTrack.title}」推荐相似歌曲`
                : '随机推荐优质歌曲，越听越懂你'
              }
            </p>
          </div>
          <Radio className="w-4 h-4 text-[var(--text-dim)] ml-auto group-hover:text-[var(--accent-amber)] transition-colors" />
        </button>
      ) : (
        /* Mode grid */
        <div className="grid grid-cols-3 gap-1.5">
          {currentModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleSelect(activeCategory, mode.id)}
              disabled={loading === mode.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] hover:border-[var(--text-dim)]/30 hover:bg-white/[0.02] transition-all group"
            >
              {loading === mode.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-cyan)]" />
              ) : (
                <span className="text-base leading-none">{mode.icon}</span>
              )}
              <span className="text-[11px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate">
                {mode.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
