import { useEffect, useRef, useCallback, useState } from 'react'
import { useMusicStore } from '../../stores/music-store'
import { useRadioStore } from '../../stores/radio-store'
import {
  FolderOpen, Shuffle, Repeat, Repeat1, Music, Disc3,
  Search, Globe, HardDrive, LogIn, Loader2, CloudOff, Radio, Mic2
} from 'lucide-react'
import { NeteaseLoginModal } from './NeteaseLoginModal'
import { RadioModeSelector } from './RadioModeSelector'
import { LyricsPanel } from './LyricsPanel'

type TabType = 'radio' | 'online' | 'local' | 'lyrics'

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null!)
  const {
    localTracks, addLocalTracks, addMusicFolder,
    searchQuery, setSearchQuery, searchResults, setSearchResults, isSearching, setIsSearching,
    playlist, setPlaylist, currentTrackIndex, setCurrentTrackIndex,
    shuffleMode, toggleShuffle, repeatMode, cycleRepeat,
    neteaseLoggedIn, setNeteaseLoggedIn, qqLoggedIn, setQQLoggedIn
  } = useMusicStore()
  const { isPlaying, setPlaying, volume, isMuted } = useRadioStore()

  const [activeTab, setActiveTab] = useState<TabType>('radio')
  const [showLogin, setShowLogin] = useState(false)
  const currentTrack = currentTrackIndex >= 0 ? playlist[currentTrackIndex] : null
  const searchTimerRef = useRef<any>(null)
  const playingIdRef = useRef<string>('')

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      (audioRef as any).current = new Audio()
    }
  }, [])

  useEffect(() => {
    window.electronAPI.onlineMusicLoginStatus().then((s: any) => {
      setNeteaseLoggedIn(s.netease)
      setQQLoggedIn(s.qq)
    })
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!query.trim()) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await window.electronAPI.onlineMusicSearch(query, 30)
        setSearchResults(results)
      } catch (e) { console.error('Search failed:', e) }
      finally { setIsSearching(false) }
    }, 400)
  }, [])

  const playTrackDirect = async (track: any) => {
    const audio = audioRef.current
    if (!audio) return

    const trackKey = `${track.source}-${track.id}`
    playingIdRef.current = trackKey

    audio.pause()

    let url: string | null = null
    if (track.source === 'local' && track.filePath) {
      url = await window.electronAPI.getMusicTrackUrl(track.filePath)
    } else {
      url = await window.electronAPI.onlineMusicGetUrl(track)
    }

    if (playingIdRef.current !== trackKey) return
    if (!url) { console.error('无法获取播放链接:', track.title); return }

    audio.src = url
    audio.volume = isMuted ? 0 : volume
    await audio.play().catch(console.error)
    setPlaying(true)
  }

  const handleClickTrack = (tracks: any[], index: number) => {
    const track = tracks[index]
    if (!track) return
    setPlaylist(tracks)
    setCurrentTrackIndex(index)
    playTrackDirect(track)
  }

  // Auto play next
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => {
      const { playlist: pl, currentTrackIndex: idx, shuffleMode: shuf, repeatMode: rpt } = useMusicStore.getState()
      if (pl.length === 0) return
      if (rpt === 'one') { playTrackDirect(pl[idx]); return }
      let next = idx + 1
      if (shuf) next = Math.floor(Math.random() * pl.length)
      if (next >= pl.length) next = rpt === 'all' ? 0 : -1
      if (next >= 0) {
        useMusicStore.getState().setCurrentTrackIndex(next)
        playTrackDirect(pl[next])
      } else {
        setPlaying(false)
      }
    }
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [])

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // React to external index changes (skip buttons)
  const prevIndexRef = useRef(currentTrackIndex)
  useEffect(() => {
    if (currentTrackIndex !== prevIndexRef.current && playlist[currentTrackIndex] && isPlaying) {
      playTrackDirect(playlist[currentTrackIndex])
    }
    prevIndexRef.current = currentTrackIndex
  }, [currentTrackIndex])

  // Play/pause from global control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  const handleAddFolder = async () => {
    const result = await window.electronAPI.pickMusicFolder()
    if (result) {
      addMusicFolder(result.folderPath)
      addLocalTracks(result.tracks.map((t: any) => ({ ...t, source: 'local' })))
    }
  }

  const handleRadioTracksLoaded = (tracks: any[]) => {
    setPlaylist(tracks)
    setCurrentTrackIndex(0)
    if (tracks.length > 0) playTrackDirect(tracks[0])
  }

  const displayTracks = activeTab === 'online' ? searchResults : activeTab === 'local' ? localTracks : []

  const sourceLabel = (source?: string) => {
    if (source === 'netease') return { text: '网易', color: 'text-red-400' }
    if (source === 'qq') return { text: 'QQ', color: 'text-green-400' }
    return { text: '本地', color: 'text-[var(--text-dim)]' }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Now Playing */}
      <div className="flex items-center gap-3.5 pb-3 border-b border-[var(--border-color)]">
        <div className={`w-12 h-12 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center flex-shrink-0 overflow-hidden transition-shadow ${isPlaying && currentTrack ? 'animate-breathe shadow-[0_0_12px_rgba(0,212,255,0.15)]' : ''}`}>
          {currentTrack?.coverUrl ? (
            <img src={currentTrack.coverUrl} className={`w-full h-full object-cover rounded-xl ${isPlaying ? 'animate-spin' : ''}`} style={isPlaying ? { animationDuration: '8s' } : undefined} />
          ) : (
            <Disc3 className={`w-6 h-6 ${currentTrack ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-dim)]'} ${isPlaying ? 'animate-spin' : ''}`} style={isPlaying ? { animationDuration: '3s' } : undefined} />
          )}
        </div>
        {currentTrack ? (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-[var(--text-dim)] truncate">{currentTrack.artist}</p>
              {currentTrack.source && currentTrack.source !== 'local' && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border border-current/20 ${sourceLabel(currentTrack.source).color}`}>
                  {sourceLabel(currentTrack.source).text}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-dim)]">选择模式或搜索歌曲开始播放</p>
        )}
      </div>

      {/* Tabs + Controls */}
      <div className="flex items-center gap-2 py-2 border-b border-[var(--border-color)]">
        <div className="flex items-center bg-[var(--bg-primary)] rounded-lg p-0.5">
          <button onClick={() => setActiveTab('radio')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'radio' ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]' : 'text-[var(--text-dim)]'}`}>
            <Radio className="w-3 h-3" /> 电台
          </button>
          <button onClick={() => setActiveTab('online')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'online' ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]' : 'text-[var(--text-dim)]'}`}>
            <Globe className="w-3 h-3" /> 搜索
          </button>
          <button onClick={() => setActiveTab('local')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'local' ? 'bg-white/10 text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}>
            <HardDrive className="w-3 h-3" /> 本地
          </button>
          <button onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${activeTab === 'lyrics' ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]' : 'text-[var(--text-dim)]'}`}>
            <Mic2 className="w-3 h-3" /> 歌词
          </button>
        </div>

        <div className="flex-1" />

        {(activeTab === 'online' || activeTab === 'radio') && (
          <button onClick={() => setShowLogin(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${
              neteaseLoggedIn && qqLoggedIn ? 'text-[var(--accent-green)]' :
              neteaseLoggedIn || qqLoggedIn ? 'text-[var(--accent-amber)]' :
              'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
            }`}>
            <LogIn className="w-3 h-3" />
            {neteaseLoggedIn && qqLoggedIn ? '已登录' :
             neteaseLoggedIn ? '网易已登录' :
             qqLoggedIn ? 'QQ已登录' : '音乐账号'}
          </button>
        )}

        {activeTab === 'local' && (
          <button onClick={handleAddFolder}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/15 border border-[var(--accent-amber)]/20 transition-colors">
            <FolderOpen className="w-3 h-3" /> 添加
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'radio' && (
          <div className="p-3">
            <RadioModeSelector onTracksLoaded={handleRadioTracksLoaded} />
            {playlist.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                <p className="text-[10px] text-[var(--text-dim)] mb-1.5 uppercase tracking-wider">播放列表 · {playlist.length} 首</p>
                <div className="-mx-3">
                  {playlist.map((track, i) => {
                    const isActive = i === currentTrackIndex
                    const label = sourceLabel(track.source)
                    return (
                      <button key={`${track.source}-${track.id}-${i}`}
                        onClick={() => handleClickTrack(playlist, i)}
                        className={`track-row w-full text-left px-4 py-1.5 flex items-center gap-2.5 hover:bg-white/[0.03] ${isActive ? 'active bg-[var(--accent-cyan)]/5' : ''}`}>
                        <span className={`text-[10px] w-4 text-right font-mono ${isActive ? 'text-[var(--accent-amber)]' : 'text-[var(--text-dim)]'}`}>
                          {isActive && isPlaying ? '♪' : i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] truncate ${isActive ? 'text-[var(--accent-amber)] font-medium' : ''}`}>{track.title}</p>
                        </div>
                        <span className="text-[10px] text-[var(--text-dim)] truncate max-w-[80px]">{track.artist}</span>
                        {track.source !== 'local' && (
                          <span className={`text-[8px] px-1 py-0.5 rounded border border-current/20 flex-shrink-0 ${label.color} opacity-50`}>{label.text}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'online' && (
          <>
            <div className="p-3 pb-0">
              <div className="relative flex items-center">
                <Search className="absolute left-[12px] w-4 h-4 text-[var(--text-dim)] pointer-events-none" style={{ zIndex: 2 }} />
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="搜索歌曲、歌手（网易云 + QQ音乐）..."
                  style={{ paddingLeft: 38 }}
                  className="w-full pr-3 py-2 rounded-lg bg-[#0a0e1e] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-cyan)]/50 focus:outline-none transition-colors" />
                {isSearching && <Loader2 className="absolute right-3 w-4 h-4 text-[var(--accent-cyan)] animate-spin" />}
              </div>
            </div>
            {renderTrackList(displayTracks, 'online')}
          </>
        )}

        {activeTab === 'local' && renderTrackList(displayTracks, 'local')}

        {activeTab === 'lyrics' && (
          <LyricsPanel track={currentTrack} audioRef={audioRef} isPlaying={isPlaying} />
        )}
      </div>

      {showLogin && <NeteaseLoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )

  function renderTrackList(tracks: any[], tab: string) {
    if (tracks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          {tab === 'online' ? (
            <>
              <CloudOff className="w-10 h-10 text-[var(--text-dim)] opacity-20" />
              <p className="text-xs text-[var(--text-dim)]">{searchQuery ? '没有找到匹配的歌曲' : '输入关键词搜索歌曲'}</p>
            </>
          ) : (
            <>
              <Music className="w-10 h-10 text-[var(--text-dim)] opacity-20" />
              <p className="text-xs text-[var(--text-dim)]">点击「添加」导入本地音乐文件夹</p>
            </>
          )}
        </div>
      )
    }

    return (
      <div className="px-1">
        {tracks.map((track, i) => {
          const isActive = playlist[currentTrackIndex]?.id === track.id && playlist[currentTrackIndex]?.source === track.source
          const label = sourceLabel(track.source)
          return (
            <button key={`${track.source}-${track.id}-${i}`}
              onClick={() => handleClickTrack(tracks, i)}
              className={`track-row w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-white/[0.03] group rounded-lg ${isActive ? 'active bg-[var(--accent-cyan)]/5' : ''}`}>
              <span className={`text-[11px] w-5 text-right font-mono ${isActive ? 'text-[var(--accent-amber)]' : 'text-[var(--text-dim)]'}`}>
                {isActive && isPlaying ? '♪' : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] truncate ${isActive ? 'text-[var(--accent-amber)] font-medium' : ''}`}>{track.title}</p>
                <p className="text-[10px] text-[var(--text-dim)] truncate">{track.artist}{track.album ? ` · ${track.album}` : ''}</p>
              </div>
              {track.source && track.source !== 'local' && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded border border-current/20 flex-shrink-0 ${label.color} opacity-60 group-hover:opacity-100`}>{label.text}</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }
}
