export interface QQTrack {
  id: string
  mid: string
  title: string
  artist: string
  album: string
  duration: number
  source: 'qq'
  coverUrl?: string
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

export class QQMusicService {
  private cookie: string = ''

  setCookie(cookie: string) { this.cookie = cookie }
  getCookie(): string { return this.cookie }

  async search(keywords: string, limit = 20): Promise<QQTrack[]> {
    try {
      const reqData = JSON.stringify({
        search: {
          method: 'DoSearchForQQMusicDesktop',
          module: 'music.search.SearchCgiService',
          param: { query: keywords, page_num: 1, num_per_page: limit }
        }
      })
      const url = 'https://u.y.qq.com/cgi-bin/musicu.fcg?data=' + encodeURIComponent(reqData)
      const headers: Record<string, string> = { 'Referer': 'https://y.qq.com/', 'User-Agent': UA }
      if (this.cookie) headers['Cookie'] = this.cookie

      const res = await fetch(url, { headers })
      const data = await res.json()
      const songs = data?.search?.data?.body?.song?.list || []

      return songs.map((s: any) => ({
        id: String(s.id || ''),
        mid: s.mid || '',
        title: s.title || s.name || '',
        artist: (s.singer || []).map((a: any) => a.name).join(' / '),
        album: s.album?.name || '',
        duration: s.interval || 0,
        source: 'qq' as const,
        coverUrl: s.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.album.mid}.jpg` : undefined
      }))
    } catch (e) {
      console.error('QQ Music search failed:', e)
      return []
    }
  }

  async getSongUrl(mid: string): Promise<string | null> {
    try {
      const guid = Math.floor(Math.random() * 10000000000).toString()
      const reqData = JSON.stringify({
        req_0: {
          module: 'vkey.GetVkeyServer',
          method: 'CgiGetVkey',
          param: {
            filename: [`M500${mid}${mid}.mp3`],
            guid,
            songmid: [mid],
            songtype: [0],
            uin: '0',
            loginflag: 1,
            platform: '20'
          }
        }
      })
      const url = 'https://u.y.qq.com/cgi-bin/musicu.fcg?data=' + encodeURIComponent(reqData)
      const headers: Record<string, string> = { 'Referer': 'https://y.qq.com/', 'User-Agent': UA }
      if (this.cookie) headers['Cookie'] = this.cookie

      const res = await fetch(url, { headers })
      const data = await res.json()
      const info = data?.req_0?.data?.midurlinfo?.[0]
      if (!info?.purl) return null

      const sip = data?.req_0?.data?.sip?.[0] || 'https://dl.stream.qqmusic.qq.com/'
      return sip + info.purl
    } catch (e) {
      console.error('QQ Music getSongUrl failed:', e)
      return null
    }
  }
}
