import { useEffect, useRef, useState } from 'react'
import { Music } from 'lucide-react'

interface LyricLine {
  time: number
  text: string
}

interface Props {
  track: { id: string; mid?: string; title: string; artist: string; source?: string } | null
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
}

export function LyricsPanel({ track, audioRef, isPlaying }: Props) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLine, setCurrentLine] = useState(-1)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const animRef = useRef<number>(0)

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!track) { setLyrics([]); setCurrentLine(-1); return }

    setLoading(true)
    setLyrics([])
    setCurrentLine(-1)

    window.electronAPI.getLyrics(track).then((lines: LyricLine[]) => {
      setLyrics(lines)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [track?.id, track?.source])

  // Sync lyrics with audio time
  useEffect(() => {
    if (!lyrics.length || !audioRef.current) return

    const sync = () => {
      const audio = audioRef.current
      if (!audio || audio.paused) {
        animRef.current = requestAnimationFrame(sync)
        return
      }

      const timeMs = audio.currentTime * 1000
      let idx = -1
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (timeMs >= lyrics[i].time) { idx = i; break }
      }

      if (idx !== currentLine) {
        setCurrentLine(idx)
      }

      animRef.current = requestAnimationFrame(sync)
    }

    animRef.current = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(animRef.current)
  }, [lyrics, isPlaying])

  // Auto scroll to current line
  useEffect(() => {
    if (currentLine >= 0 && lineRefs.current[currentLine] && containerRef.current) {
      const line = lineRefs.current[currentLine]
      const container = containerRef.current
      if (line) {
        const lineTop = line.offsetTop
        const containerH = container.clientHeight
        container.scrollTo({
          top: lineTop - containerH / 2 + line.clientHeight / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [currentLine])

  if (!track) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[10px] text-[var(--text-dim)] animate-pulse">加载歌词...</span>
      </div>
    )
  }

  if (lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 gap-2">
        <Music className="w-3 h-3 text-[var(--text-dim)]" />
        <span className="text-[10px] text-[var(--text-dim)]">暂无歌词</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto min-h-0 py-4 mask-gradient"
      style={{
        maskImage: 'linear-gradient(transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(transparent 0%, black 15%, black 85%, transparent 100%)'
      }}
    >
      <div className="flex flex-col items-center gap-1 px-4">
        {lyrics.map((line, i) => {
          const isCurrent = i === currentLine
          const isPast = i < currentLine

          return (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el }}
              className={`text-center py-1 transition-all duration-300 ${
                isCurrent
                  ? 'text-[var(--accent-cyan)] text-[14px] font-semibold glow-text scale-105'
                  : isPast
                  ? 'text-[var(--text-dim)] text-[12px]'
                  : 'text-[var(--text-secondary)] text-[12px]'
              }`}
            >
              {line.text}
            </div>
          )
        })}
        <div className="h-20" />
      </div>
    </div>
  )
}
