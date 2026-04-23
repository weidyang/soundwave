const NeteaseApi = require('NeteaseCloudMusicApi')

export interface OnlineTrack {
  id: string
  mid?: string
  title: string
  artist: string
  album: string
  duration: number
  source: 'netease' | 'qq'
  coverUrl?: string
}

export interface SearchResult {
  tracks: OnlineTrack[]
  source: 'netease' | 'qq'
}

export class NeteaseService {
  private cookie: string = ''

  setCookie(cookie: string) {
    this.cookie = cookie
  }

  getCookie(): string {
    return this.cookie
  }

  async search(keywords: string, limit = 20): Promise<OnlineTrack[]> {
    try {
      const result = await NeteaseApi.search({ keywords, type: 1, limit, cookie: this.cookie })
      const songs = result?.body?.result?.songs || []
      return songs.map((s: any) => ({
        id: String(s.id),
        title: s.name,
        artist: (s.artists || s.ar || []).map((a: any) => a.name).join(' / '),
        album: s.album?.name || s.al?.name || '',
        duration: Math.round((s.duration || s.dt || 0) / 1000),
        source: 'netease' as const,
        coverUrl: s.al?.picUrl || s.album?.picUrl || undefined
      }))
    } catch (e) {
      console.error('NetEase search failed:', e)
      return []
    }
  }

  async getSongUrl(id: string): Promise<string | null> {
    try {
      const result = await NeteaseApi.song_url({ id: Number(id), cookie: this.cookie })
      const data = result?.body?.data?.[0]
      return data?.url || null
    } catch (e) {
      console.error('NetEase getSongUrl failed:', e)
      return null
    }
  }

  async getQRKey(): Promise<{ key: string; qrimg: string } | null> {
    try {
      const keyRes = await NeteaseApi.login_qr_key({})
      const unikey = keyRes?.body?.data?.unikey
      if (!unikey) return null
      const createRes = await NeteaseApi.login_qr_create({ key: unikey, qrimg: true })
      const qrimg = createRes?.body?.data?.qrimg || ''
      return { key: unikey, qrimg }
    } catch (e) {
      console.error('NetEase QR key failed:', e)
      return null
    }
  }

  async checkQRLogin(key: string): Promise<{ code: number; cookie?: string; message?: string }> {
    try {
      const res = await NeteaseApi.login_qr_check({ key })
      const code = res?.body?.code
      if (code === 803 && res?.body?.cookie) {
        this.cookie = res.body.cookie
        return { code: 803, cookie: res.body.cookie }
      }
      return { code, message: res?.body?.message }
    } catch (e) {
      return { code: -1, message: String(e) }
    }
  }

  async getUserPlaylists(uid: string): Promise<any[]> {
    try {
      const res = await NeteaseApi.user_playlist({ uid, cookie: this.cookie })
      return res?.body?.playlist || []
    } catch {
      return []
    }
  }

  async getPlaylistTracks(id: string): Promise<OnlineTrack[]> {
    try {
      const res = await NeteaseApi.playlist_track_all({ id: Number(id), cookie: this.cookie, limit: 100 })
      const songs = res?.body?.songs || []
      return songs.map((s: any) => ({
        id: String(s.id),
        title: s.name,
        artist: (s.ar || []).map((a: any) => a.name).join(' / '),
        album: s.al?.name || '',
        duration: Math.round((s.dt || 0) / 1000),
        source: 'netease' as const,
        coverUrl: s.al?.picUrl || undefined
      }))
    } catch {
      return []
    }
  }
}
