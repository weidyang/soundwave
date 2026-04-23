import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),

  // Channels
  listChannels: () => ipcRenderer.invoke('channels:list'),

  // Claude AI
  generateContent: (channelConfig: any, context: any) =>
    ipcRenderer.invoke('claude:generate', channelConfig, context),
  onContentStream: (callback: (segment: any) => void) => {
    const handler = (_: any, segment: any) => callback(segment)
    ipcRenderer.on('claude:content-stream', handler)
    return () => ipcRenderer.removeListener('claude:content-stream', handler)
  },

  // TTS
  synthesize: (text: string, voice?: string, options?: any) =>
    ipcRenderer.invoke('tts:synthesize', text, voice, options),
  getVoices: () => ipcRenderer.invoke('tts:voices'),

  // Local Music
  scanMusicFolder: (folderPath: string) => ipcRenderer.invoke('music:scan-folder', folderPath),
  pickMusicFolder: () => ipcRenderer.invoke('music:pick-folder'),
  getMusicTrackUrl: (filePath: string) => ipcRenderer.invoke('music:get-track-url', filePath),
  getLyrics: (track: any) => ipcRenderer.invoke('music:get-lyrics', track),

  // Podcast (喜马拉雅/蜻蜓FM)
  podcastSearch: (keyword: string, limit?: number) => ipcRenderer.invoke('podcast:search', keyword, limit),
  podcastGetUrl: (track: any) => ipcRenderer.invoke('podcast:get-url', track),
  podcastCategories: () => ipcRenderer.invoke('podcast:categories'),
  podcastCategoryTracks: (categoryId: string) => ipcRenderer.invoke('podcast:category-tracks', categoryId),
  podcastRanking: () => ipcRenderer.invoke('podcast:ranking'),
  podcastLoginStatus: () => ipcRenderer.invoke('podcast:login-status'),
  podcastLogout: (platform: string) => ipcRenderer.invoke('podcast:logout', platform),
  ximalayaWebLogin: () => ipcRenderer.invoke('podcast:ximalaya-web-login'),
  qingtingWebLogin: () => ipcRenderer.invoke('podcast:qingting-web-login'),

  // Online Music (multi-source: NetEase + QQ)
  onlineMusicSearch: (keywords: string, limit?: number) =>
    ipcRenderer.invoke('online-music:search', keywords, limit),
  onlineMusicGetUrl: (track: any) =>
    ipcRenderer.invoke('online-music:get-url', track),
  onlineMusicLoginStatus: () =>
    ipcRenderer.invoke('online-music:login-status'),

  // NetEase QR login
  neteaseQRKey: () => ipcRenderer.invoke('online-music:netease-qr-key'),
  neteaseQRCheck: (key: string) => ipcRenderer.invoke('online-music:netease-qr-check', key),
  setNeteaseCookie: (cookie: string) => ipcRenderer.invoke('online-music:set-netease-cookie', cookie),
  setQQCookie: (cookie: string) => ipcRenderer.invoke('online-music:set-qq-cookie', cookie),

  // QQ Music web login (opens browser window)
  qqWebLogin: () => ipcRenderer.invoke('online-music:qq-web-login'),

  // NetEase playlists
  neteasePlaylists: (uid: string) => ipcRenderer.invoke('online-music:netease-playlists', uid),
  neteasePlaylistTracks: (id: string) => ipcRenderer.invoke('online-music:netease-playlist-tracks', id),

  // Radio Modes (mood / genre / chart / smart)
  getRadioModes: () => ipcRenderer.invoke('radio-mode:get-modes'),
  getRadioMoodTracks: (moodId: string) => ipcRenderer.invoke('radio-mode:mood', moodId),
  getRadioGenreTracks: (genreId: string) => ipcRenderer.invoke('radio-mode:genre', genreId),
  getRadioChartTracks: (chartId: string) => ipcRenderer.invoke('radio-mode:chart', chartId),
  getRadioSmartTracks: (currentTrack?: any) => ipcRenderer.invoke('radio-mode:smart', currentTrack),

  // AI Assistant
  assistantChat: (message: string, context?: any) => ipcRenderer.invoke('assistant:chat', message, context),
  assistantClear: () => ipcRenderer.invoke('assistant:clear')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
