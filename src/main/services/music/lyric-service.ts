const NeteaseApi = require('NeteaseCloudMusicApi')

export interface LyricLine {
  time: number  // milliseconds
  text: string
}

export class LyricService {
  async getLyrics(track: { id: string; mid?: string; title: string; artist: string; source?: string }): Promise<LyricLine[]> {
    let lines: LyricLine[] = []

    if (track.source === 'qq' && track.mid) {
      lines = await this.getQQLyric(track.mid)
    } else if (track.source === 'netease') {
      lines = await this.getNeteaseLyric(track.id)
    }

    // Fallback: search by title+artist on netease
    if (lines.length === 0 && track.title) {
      lines = await this.searchAndGetLyric(track.title, track.artist)
    }

    return lines
  }

  private async getNeteaseLyric(id: string): Promise<LyricLine[]> {
    try {
      const res = await NeteaseApi.lyric({ id: Number(id) })
      const lrc = res?.body?.lrc?.lyric
      if (!lrc) return []
      return this.parseLRC(lrc)
    } catch {
      return []
    }
  }

  private async getQQLyric(mid: string): Promise<LyricLine[]> {
    try {
      const url = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${mid}&format=json&nobase64=1`
      const res = await fetch(url, { headers: { 'Referer': 'https://y.qq.com/' } })
      const data = await res.json()
      if (!data?.lyric) return []
      return this.parseLRC(data.lyric)
    } catch {
      return []
    }
  }

  private async searchAndGetLyric(title: string, artist: string): Promise<LyricLine[]> {
    try {
      const keyword = artist ? `${title} ${artist}` : title
      const searchRes = await NeteaseApi.search({ keywords: keyword, type: 1, limit: 1 })
      const songId = searchRes?.body?.result?.songs?.[0]?.id
      if (!songId) return []
      return this.getNeteaseLyric(String(songId))
    } catch {
      return []
    }
  }

  private parseLRC(lrc: string): LyricLine[] {
    const lines: LyricLine[] = []
    const regex = /\[(\d{2}):(\d{2})[.:·](\d{2,3})\](.*)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(lrc)) !== null) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      let ms = parseInt(match[3])
      if (match[3].length === 2) ms *= 10
      const time = min * 60000 + sec * 1000 + ms
      const text = match[4].trim()
      if (text) lines.push({ time, text })
    }

    lines.sort((a, b) => a.time - b.time)
    return lines
  }
}
