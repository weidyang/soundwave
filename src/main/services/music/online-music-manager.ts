import { NeteaseService, OnlineTrack } from './netease-service'
import { QQMusicService, QQTrack } from './qq-music-service'
import { MusicService } from './music-service'

export type AnyTrack = OnlineTrack | QQTrack

export interface RadioMode {
  id: string
  name: string
  icon: string
  color: string
  keywords: string[]
}

export const MOOD_MODES: RadioMode[] = [
  { id: 'happy', name: '开心', icon: '😊', color: '#FFD93D', keywords: ['欢快', '开心', '快乐', 'happy', '阳光'] },
  { id: 'chill', name: '放松', icon: '😌', color: '#6BCB77', keywords: ['轻松', '舒缓', 'chill', '慵懒', '午后'] },
  { id: 'sad', name: '伤感', icon: '😢', color: '#4D96FF', keywords: ['伤感', '难过', '思念', '离别', '忧伤'] },
  { id: 'workout', name: '运动', icon: '🏃', color: '#FF6B6B', keywords: ['运动', '健身', '热血', '节奏感', 'workout'] },
  { id: 'focus', name: '专注', icon: '🎯', color: '#C77DFF', keywords: ['纯音乐', '钢琴', '专注', 'lo-fi', '白噪音'] },
  { id: 'sleep', name: '助眠', icon: '🌙', color: '#7B8FA1', keywords: ['睡前', '安静', '轻柔', '助眠', 'sleep'] },
]

export const GENRE_MODES: RadioMode[] = [
  { id: 'cpop', name: '华语流行', icon: '🎤', color: '#FF6B6B', keywords: ['华语流行', '国语新歌', '华语热歌'] },
  { id: 'western', name: '欧美', icon: '🌍', color: '#4D96FF', keywords: ['欧美流行', 'pop hits', 'billboard'] },
  { id: 'jpkr', name: '日韩', icon: '🗾', color: '#FF9F45', keywords: ['日语歌曲', '韩语歌曲', 'J-pop', 'K-pop'] },
  { id: 'chinese_style', name: '古风', icon: '🏮', color: '#C77DFF', keywords: ['古风', '中国风', '国潮', '古典'] },
  { id: 'rock', name: '摇滚', icon: '🎸', color: '#FF4757', keywords: ['摇滚', 'rock', '朋克', '独立摇滚'] },
  { id: 'electronic', name: '电子', icon: '🎹', color: '#00D4FF', keywords: ['电子', 'EDM', 'DJ', 'electronic'] },
  { id: 'folk', name: '民谣', icon: '🪕', color: '#6BCB77', keywords: ['民谣', '吉他', '校园民谣', 'folk'] },
  { id: 'rnb', name: 'R&B', icon: '🎷', color: '#FFD93D', keywords: ['R&B', '节奏蓝调', 'soul', '灵魂乐'] },
]

export const CHART_MODES: RadioMode[] = [
  { id: 'netease_hot', name: '网易飙升榜', icon: '🔥', color: '#FF4757', keywords: [] },
  { id: 'netease_new', name: '网易新歌榜', icon: '✨', color: '#FFD93D', keywords: [] },
  { id: 'qq_hot', name: 'QQ热歌榜', icon: '📈', color: '#6BCB77', keywords: [] },
  { id: 'qq_new', name: 'QQ新歌榜', icon: '🆕', color: '#4D96FF', keywords: [] },
]

export class OnlineMusicManager {
  netease: NeteaseService
  qq: QQMusicService
  local: MusicService

  constructor() {
    this.netease = new NeteaseService()
    this.qq = new QQMusicService()
    this.local = new MusicService()
  }

  async search(keywords: string, limit = 20): Promise<AnyTrack[]> {
    const [neteaseResults, qqResults] = await Promise.allSettled([
      this.netease.search(keywords, limit),
      this.qq.search(keywords, limit)
    ])

    const netease = neteaseResults.status === 'fulfilled' ? neteaseResults.value : []
    const qq = qqResults.status === 'fulfilled' ? qqResults.value : []

    const merged: AnyTrack[] = []
    const maxLen = Math.max(netease.length, qq.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < netease.length) merged.push(netease[i])
      if (i < qq.length) merged.push(qq[i])
    }
    return merged
  }

  async getSongUrl(track: AnyTrack): Promise<string | null> {
    if (track.source === 'netease') {
      return this.netease.getSongUrl(track.id)
    } else if (track.source === 'qq') {
      const mid = (track as QQTrack).mid || track.id
      return this.qq.getSongUrl(mid)
    }
    return null
  }

  // ===== Radio Modes =====

  async getMoodTracks(moodId: string, limit = 30): Promise<AnyTrack[]> {
    const mood = MOOD_MODES.find(m => m.id === moodId)
    if (!mood) return []
    const keyword = mood.keywords[Math.floor(Math.random() * mood.keywords.length)]
    const results = await this.search(keyword, limit)
    return this.shuffleArray(results)
  }

  async getGenreTracks(genreId: string, limit = 30): Promise<AnyTrack[]> {
    const genre = GENRE_MODES.find(g => g.id === genreId)
    if (!genre) return []
    const keyword = genre.keywords[Math.floor(Math.random() * genre.keywords.length)]
    const results = await this.search(keyword, limit)
    return this.shuffleArray(results)
  }

  async getChartTracks(chartId: string): Promise<AnyTrack[]> {
    try {
      if (chartId === 'netease_hot' || chartId === 'netease_new') {
        return await this.getNeteaseChart(chartId)
      } else if (chartId === 'qq_hot' || chartId === 'qq_new') {
        return await this.getQQChart(chartId)
      }
    } catch (e) {
      console.error('Chart fetch failed:', e)
    }
    return []
  }

  async getSmartRadio(currentTrack?: AnyTrack): Promise<AnyTrack[]> {
    const keywords: string[] = []
    if (currentTrack) {
      if (currentTrack.artist) keywords.push(currentTrack.artist.split('/')[0].trim())
      if (currentTrack.title) {
        const clean = currentTrack.title.replace(/[\(\[\（【].*?[\)\]\）】]/g, '').trim()
        if (clean.length <= 6) keywords.push(clean)
      }
    }

    if (keywords.length === 0) {
      const fallback = ['周杰伦', '林俊杰', '陈奕迅', '邓紫棋', 'Taylor Swift', 'Adele', '五月天', '薛之谦', '毛不易']
      keywords.push(fallback[Math.floor(Math.random() * fallback.length)])
    }

    const keyword = keywords[Math.floor(Math.random() * keywords.length)]
    const results = await this.search(keyword, 30)
    return this.shuffleArray(results)
  }

  private async getNeteaseChart(chartId: string): Promise<AnyTrack[]> {
    const NeteaseApi = require('NeteaseCloudMusicApi')
    const toplistId = chartId === 'netease_hot' ? 19723756 : 3779629
    try {
      const res = await NeteaseApi.playlist_track_all({ id: toplistId, cookie: this.netease.getCookie(), limit: 50 })
      const songs = res?.body?.songs || []
      return this.shuffleArray(songs.map((s: any) => ({
        id: String(s.id),
        title: s.name,
        artist: (s.ar || []).map((a: any) => a.name).join(' / '),
        album: s.al?.name || '',
        duration: Math.round((s.dt || 0) / 1000),
        source: 'netease' as const,
        coverUrl: s.al?.picUrl || undefined
      })))
    } catch {
      return []
    }
  }

  private async getQQChart(chartId: string): Promise<AnyTrack[]> {
    const keyword = chartId === 'qq_hot' ? '热歌榜' : '新歌榜'
    const results = await this.qq.search(keyword, 30)
    return this.shuffleArray(results as AnyTrack[])
  }

  // Netease QR login
  async getNeteaseQRKey() { return this.netease.getQRKey() }
  async checkNeteaseQRLogin(key: string) { return this.netease.checkQRLogin(key) }
  setNeteaseCookie(cookie: string) { this.netease.setCookie(cookie) }
  setQQCookie(cookie: string) { this.qq.setCookie(cookie) }

  getLoginStatus() {
    return { netease: !!this.netease.getCookie(), qq: !!this.qq.getCookie() }
  }

  getRadioModes() {
    return { moods: MOOD_MODES, genres: GENRE_MODES, charts: CHART_MODES }
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}
