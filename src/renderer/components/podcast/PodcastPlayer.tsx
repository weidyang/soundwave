import { useEffect, useRef, useCallback, useState } from 'react'
import { useRadioStore } from '../../stores/radio-store'
import {
  Search, Loader2, Headphones, TrendingUp, LayoutGrid, Mic2, LogIn
} from 'lucide-react'
import { PodcastLoginModal } from './PodcastLoginModal'

interface PodcastTrack {
  id: string
  title: string
  author: string
  album: string
  duration: number
  playUrl?: string
  coverUrl?: string
  source: string
}

interface Category { id: string; name: string }
type Tab = 'category' | 'ranking' | 'search'

export function PodcastPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isPlaying, setPlaying, volume, isMuted } = useRadioStore()

  const [activeTab, setActiveTab] = useState<Tab>('category')
  const [categories, setCategories] = useState<Category[]>([])
  const [tracks, setTracks] = useState<PodcastTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [xmlyLoggedIn, setXmlyLoggedIn] = useState(false)
  const [qtLoggedIn, setQtLoggedIn] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const searchTimerRef = useRef<any>(null)

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null

  useEffect(() => {
    window.electronAPI.podcastCategories().then(setCategories)
    window.electronAPI.podcastLoginStatus().then((s: any) => {
      setXmlyLoggedIn(s.ximalaya)
      setQtLoggedIn(s.qingting)
    })
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!query.trim()) { setTracks([]); return }
    searchTimerRef.current = setTimeout(async () => {
      setLoading(true)
      try { setTracks(await window.electronAPI.podcastSearch(query, 30)) }
      catch (e) { console.error(e) }
      finally { setLoading(false) }
    }, 500)
  }, [])

  const handleCategoryClick = async (catId: string) => {
    setActiveCategory(catId)
    setLoading(true)
    try { setTracks(await window.electronAPI.podcastCategoryTracks(catId)) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleRanking = async () => {
    setActiveTab('ranking')
    setLoading(true)
    try { setTracks(await window.electronAPI.podcastRanking()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const playTrack = useCallback(async (index: number) => {
    const track = tracks[index]
    if (!track) return
    setCurrentIndex(index)
    setPlayError(null)

    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    audio.pause()

    let url = track.playUrl || null
    if (!url) {
      url = await window.electronAPI.podcastGetUrl(track)
    }
    if (!url) {
      const src = track.source === 'ximalaya' ? '喜马拉雅' : '蜻蜓FM'
      setPlayError(`无法播放，请先登录${src}`)
      return
    }

    audio.src = url
    audio.volume = isMuted ? 0 : volume
    audio.play().catch((e) => {
      console.error('Playback error:', e)
      setPlayError('播放失败: ' + e.message)
    })
    setPlaying(true)
  }, [tracks, isMuted, volume])

  const playNext = useCallback(() => {
    if (currentIndex < tracks.length - 1) playTrack(currentIndex + 1)
    else setPlaying(false)
  }, [currentIndex, tracks.length, playTrack])

  useEffect(() => { if (audioRef.current) audioRef.current.onended = playNext }, [playNext])
  useEffect(() => { if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume }, [volume, isMuted])
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && audioRef.current.src) audioRef.current.play().catch(() => {})
    else audioRef.current.pause()
  }, [isPlaying])

  const handleXmlyLogin = async () => {
    const cookie = await window.electronAPI.ximalayaWebLogin()
    if (cookie) setXmlyLoggedIn(true)
  }

  const handleQtLogin = async () => {
    const cookie = await window.electronAPI.qingtingWebLogin()
    if (cookie) setQtLoggedIn(true)
  }

  const sourceLabel = (s: string) => {
    if (s === 'ximalaya') return { text: '喜马拉雅', color: 'text-orange-400' }
    if (s === 'qingting') return { text: '蜻蜓FM', color: 'text-green-400' }
    return { text: s, color: 'text-[var(--text-dim)]' }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Now Playing */}
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentTrack?.coverUrl ? (
            <img src={currentTrack.coverUrl} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Mic2 className={`w-5 h-5 ${currentTrack ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-dim)]'}`} />
          )}
        </div>
        {currentTrack ? (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-[var(--text-dim)] truncate">{currentTrack.author}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border border-current/20 ${sourceLabel(currentTrack.source).color}`}>
                {sourceLabel(currentTrack.source).text}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)]">选择分类或搜索播客</p>
        )}
        {playError && (
          <p className="text-[10px] text-[var(--accent-red)] ml-auto flex-shrink-0">{playError}</p>
        )}
      </div>

      {/* Tabs + Login */}
      <div className="flex items-center gap-2 py-2 border-b border-[var(--border-color)]">
        <div className="flex items-center bg-[var(--bg-primary)] rounded-lg p-0.5">
          <button onClick={() => { setActiveTab('category'); setTracks([]); setActiveCategory(null) }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'category' ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]' : 'text-[var(--text-dim)]'}`}>
            <LayoutGrid className="w-3 h-3" /> 分类
          </button>
          <button onClick={handleRanking}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'ranking' ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]' : 'text-[var(--text-dim)]'}`}>
            <TrendingUp className="w-3 h-3" /> 热门
          </button>
          <button onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'search' ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}>
            <Search className="w-3 h-3" /> 搜索
          </button>
        </div>

        <div className="flex-1" />

        {/* Login button */}
        <button onClick={() => setShowLogin(true)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${
            xmlyLoggedIn && qtLoggedIn ? 'text-[var(--accent-green)]' :
            xmlyLoggedIn || qtLoggedIn ? 'text-[var(--accent-amber)]' :
            'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
          }`}>
          <LogIn className="w-3 h-3" />
          {xmlyLoggedIn && qtLoggedIn ? '已登录' :
           xmlyLoggedIn ? '喜马✓' :
           qtLoggedIn ? '蜻蜓✓' : '播客账号'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Not logged in hint */}
        {!xmlyLoggedIn && !qtLoggedIn && activeTab === 'category' && tracks.length === 0 && !loading && (
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/15 text-[11px] text-[var(--accent-amber)]">
              <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
              <span>登录喜马拉雅或蜻蜓FM 后可搜索和播放更多内容</span>
            </div>
          </div>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <div className="p-3 pb-0">
            <div className="relative flex items-center">
              <Search className="absolute left-[12px] w-4 h-4 text-[var(--text-dim)] pointer-events-none" style={{ zIndex: 2 }} />
              <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索播客、有声书、电台节目..."
                style={{ paddingLeft: 38 }}
                className="w-full pr-3 py-2 rounded-lg bg-[#0a0e1e] border border-[var(--border-color)] text-sm placeholder:text-[var(--text-dim)] focus:border-[var(--accent-cyan)]/50 focus:outline-none transition-colors" />
              {loading && <Loader2 className="absolute right-3 w-4 h-4 text-[var(--accent-cyan)] animate-spin" />}
            </div>
          </div>
        )}

        {/* Category grid */}
        {activeTab === 'category' && tracks.length === 0 && !loading && (
          <div className="p-3 grid grid-cols-2 gap-1.5">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                  activeCategory === cat.id
                    ? 'border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 text-[var(--accent-cyan)]'
                    : 'border-[var(--border-color)] hover:border-[var(--text-dim)]/30 hover:bg-white/[0.02] text-[var(--text-secondary)]'
                }`}>
                <Headphones className="w-3.5 h-3.5" />
                <span className="text-[12px] font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {loading && tracks.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[var(--accent-cyan)] animate-spin" />
          </div>
        )}

        {(activeTab === 'category' || activeTab === 'ranking') && tracks.length > 0 && (
          <div className="px-3 pt-2">
            <button onClick={() => { setTracks([]); setActiveCategory(null) }}
              className="text-[11px] text-[var(--text-dim)] hover:text-[var(--accent-cyan)] transition-colors mb-1">
              ← 返回
            </button>
          </div>
        )}

        {/* Track list */}
        {tracks.length > 0 && (
          <div className="px-1">
            {tracks.map((track, i) => {
              const isActive = i === currentIndex
              const label = sourceLabel(track.source)
              return (
                <button key={`${track.source}-${track.id}-${i}`}
                  onClick={() => playTrack(i)}
                  className={`track-row w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-white/[0.03] group rounded-lg ${isActive ? 'active bg-[var(--accent-cyan)]/5' : ''}`}>
                  <span className={`text-[11px] w-5 text-right font-mono ${isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-dim)]'}`}>
                    {isActive && isPlaying ? '♪' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${isActive ? 'text-[var(--accent-cyan)] font-medium' : ''}`}>{track.title}</p>
                    <p className="text-[10px] text-[var(--text-dim)] truncate">{track.author}{track.album ? ` · ${track.album}` : ''}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border border-current/20 flex-shrink-0 ${label.color} opacity-60 group-hover:opacity-100`}>
                    {label.text}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {!loading && tracks.length === 0 && activeTab === 'search' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Headphones className="w-10 h-10 text-[var(--text-dim)] opacity-20" />
            <p className="text-xs text-[var(--text-dim)]">{searchQuery ? '没有找到结果' : '搜索喜马拉雅、蜻蜓FM 播客内容'}</p>
          </div>
        )}
      </div>

      {showLogin && (
        <PodcastLoginModal
          onClose={() => setShowLogin(false)}
          xmlyLoggedIn={xmlyLoggedIn}
          qtLoggedIn={qtLoggedIn}
          onXmlyLogin={async () => {
            const cookie = await window.electronAPI.ximalayaWebLogin()
            if (cookie) setXmlyLoggedIn(true)
          }}
          onQtLogin={async () => {
            const cookie = await window.electronAPI.qingtingWebLogin()
            if (cookie) setQtLoggedIn(true)
          }}
          onLogout={async (platform) => {
            await window.electronAPI.podcastLogout(platform)
            if (platform === 'ximalaya') setXmlyLoggedIn(false)
            else setQtLoggedIn(false)
          }}
        />
      )}
    </div>
  )
}
