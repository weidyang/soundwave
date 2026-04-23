import { create } from 'zustand'

interface MusicTrack {
  id: string
  mid?: string
  title: string
  artist: string
  album: string
  duration: number
  filePath?: string
  source?: 'local' | 'netease' | 'qq'
  coverUrl?: string
}

type TabType = 'local' | 'online'

interface MusicState {
  // Tab
  activeTab: TabType
  setActiveTab: (tab: TabType) => void

  // Local
  localTracks: MusicTrack[]
  musicFolders: string[]
  setLocalTracks: (tracks: MusicTrack[]) => void
  addLocalTracks: (tracks: MusicTrack[]) => void
  addMusicFolder: (folder: string) => void

  // Online search
  searchQuery: string
  searchResults: MusicTrack[]
  isSearching: boolean
  setSearchQuery: (query: string) => void
  setSearchResults: (results: MusicTrack[]) => void
  setIsSearching: (v: boolean) => void

  // Playback
  playlist: MusicTrack[]
  currentTrackIndex: number
  setPlaylist: (tracks: MusicTrack[]) => void
  setCurrentTrackIndex: (index: number) => void

  // Modes
  shuffleMode: boolean
  repeatMode: 'off' | 'all' | 'one'
  toggleShuffle: () => void
  cycleRepeat: () => void

  // Login
  neteaseLoggedIn: boolean
  qqLoggedIn: boolean
  setNeteaseLoggedIn: (v: boolean) => void
  setQQLoggedIn: (v: boolean) => void

  getCurrentTrack: () => MusicTrack | undefined
}

export const useMusicStore = create<MusicState>((set, get) => ({
  activeTab: 'online',
  setActiveTab: (activeTab) => set({ activeTab }),

  localTracks: [],
  musicFolders: [],
  setLocalTracks: (localTracks) => set({ localTracks }),
  addLocalTracks: (newTracks) => set((s) => ({
    localTracks: [...s.localTracks, ...newTracks.filter(t => !s.localTracks.some(e => e.filePath === t.filePath))]
  })),
  addMusicFolder: (folder) => set((s) => ({
    musicFolders: s.musicFolders.includes(folder) ? s.musicFolders : [...s.musicFolders, folder]
  })),

  searchQuery: '',
  searchResults: [],
  isSearching: false,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setIsSearching: (isSearching) => set({ isSearching }),

  playlist: [],
  currentTrackIndex: -1,
  setPlaylist: (playlist) => set({ playlist }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),

  shuffleMode: false,
  repeatMode: 'off',
  toggleShuffle: () => set((s) => ({ shuffleMode: !s.shuffleMode })),
  cycleRepeat: () => set((s) => ({
    repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off'
  })),

  neteaseLoggedIn: false,
  qqLoggedIn: false,
  setNeteaseLoggedIn: (neteaseLoggedIn) => set({ neteaseLoggedIn }),
  setQQLoggedIn: (qqLoggedIn) => set({ qqLoggedIn }),

  getCurrentTrack: () => {
    const { playlist, currentTrackIndex } = get()
    return currentTrackIndex >= 0 ? playlist[currentTrackIndex] : undefined
  }
}))
