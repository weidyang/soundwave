export interface PodcastTrack {
  id: string
  title: string
  author: string
  album: string
  duration: number
  playUrl: string
  coverUrl?: string
  source: 'ximalaya' | 'qingting'
}

export interface PodcastCategory {
  id: string
  name: string
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export class PodcastService {
  private ximalayaCookie: string = ''
  private qingtingCookie: string = ''

  setXimalayaCookie(cookie: string) { this.ximalayaCookie = cookie }
  getXimalayaCookie(): string { return this.ximalayaCookie }
  setQingtingCookie(cookie: string) { this.qingtingCookie = cookie }
  getQingtingCookie(): string { return this.qingtingCookie }

  getLoginStatus() {
    return {
      ximalaya: !!this.ximalayaCookie,
      qingting: !!this.qingtingCookie
    }
  }

  async search(keyword: string, limit = 20): Promise<PodcastTrack[]> {
    const [xmly, qt] = await Promise.allSettled([
      this.ximalayaSearch(keyword, limit),
      this.qingtingSearch(keyword, limit)
    ])

    const results: PodcastTrack[] = []
    const sources = [
      xmly.status === 'fulfilled' ? xmly.value : [],
      qt.status === 'fulfilled' ? qt.value : []
    ]

    const maxLen = Math.max(...sources.map(s => s.length))
    for (let i = 0; i < maxLen; i++) {
      for (const src of sources) {
        if (i < src.length) results.push(src[i])
      }
    }
    return results.slice(0, limit * 2)
  }

  async getPlayUrl(track: PodcastTrack): Promise<string | null> {
    if (track.playUrl) return track.playUrl
    if (track.source === 'ximalaya') return this.ximalayaGetPlayUrl(track.id)
    if (track.source === 'qingting') return this.qingtingGetPlayUrl(track.id)
    return null
  }

  async getRanking(): Promise<PodcastTrack[]> {
    return this.ximalayaSearch('热门推荐', 30)
  }

  getCategories(): PodcastCategory[] {
    return [
      { id: 'story', name: '有声书' },
      { id: 'talk', name: '脱口秀' },
      { id: 'history', name: '历史人文' },
      { id: 'tech', name: '科技数码' },
      { id: 'emotion', name: '情感生活' },
      { id: 'comedy', name: '相声评书' },
      { id: 'kids', name: '儿童故事' },
      { id: 'business', name: '商业财经' },
      { id: 'news', name: '新闻资讯' },
      { id: 'english', name: '英语学习' }
    ]
  }

  async getCategoryTracks(categoryId: string, limit = 30): Promise<PodcastTrack[]> {
    const keywordMap: Record<string, string[]> = {
      story: ['有声小说', '有声书', '悬疑小说'],
      talk: ['脱口秀', '搞笑段子'],
      history: ['历史', '百家讲坛', '历史故事'],
      tech: ['科技', '互联网', '人工智能'],
      emotion: ['情感', '心灵鸡汤'],
      comedy: ['相声', '评书', '郭德纲'],
      kids: ['儿童故事', '睡前故事', '童话'],
      business: ['商业', '财经', '创业'],
      news: ['新闻', '时事', '资讯'],
      english: ['英语', '英语学习', '英语口语']
    }
    const keywords = keywordMap[categoryId] || ['热门']
    const keyword = keywords[Math.floor(Math.random() * keywords.length)]
    return this.search(keyword, limit)
  }

  // ===== Ximalaya (uses /revision/search which bypasses risk filter) =====
  private async ximalayaSearch(keyword: string, limit: number): Promise<PodcastTrack[]> {
    try {
      const url = `https://www.ximalaya.com/revision/search?kw=${encodeURIComponent(keyword)}&page=1&rows=${limit}&core=track&condition=relation`
      const headers: Record<string, string> = { 'User-Agent': UA, 'Referer': 'https://www.ximalaya.com/' }
      if (this.ximalayaCookie) headers['Cookie'] = this.ximalayaCookie

      const res = await fetch(url, { headers })
      const data = await res.json()
      const docs = data?.data?.result?.response?.docs || []

      return docs.map((t: any) => ({
        id: String(t.id),
        title: (t.title || t.richTitle || '').replace(/<[^>]+>/g, ''),
        author: t.nickname || '',
        album: (t.album_title || '').replace(/<[^>]+>/g, ''),
        duration: Math.round(t.duration || 0),
        playUrl: t.play_path_64 || t.play_path_32 || '',
        coverUrl: t.cover_path ? (t.cover_path.startsWith('http') ? t.cover_path : `https:${t.cover_path}`) : (t.album_cover_path ? `https://imagev2.xmcdn.com/${t.album_cover_path}` : undefined),
        source: 'ximalaya' as const
      }))
    } catch (e) {
      console.error('Ximalaya search error:', e)
      return []
    }
  }

  private async ximalayaGetPlayUrl(trackId: string): Promise<string | null> {
    try {
      const url = `https://www.ximalaya.com/revision/play/tracks?trackIds=${trackId}`
      const headers: Record<string, string> = { 'User-Agent': UA, 'Referer': 'https://www.ximalaya.com/' }
      if (this.ximalayaCookie) headers['Cookie'] = this.ximalayaCookie
      const res = await fetch(url, { headers })
      const data = await res.json()
      return data?.data?.tracksForAudioPlay?.[0]?.src || null
    } catch {
      return null
    }
  }

  // ===== QingTing FM =====
  private async qingtingSearch(keyword: string, limit: number): Promise<PodcastTrack[]> {
    try {
      const url = `https://search.qingting.fm/v3/search?k=${encodeURIComponent(keyword)}&page=1&pagesize=${limit}&type=content`
      const headers: Record<string, string> = { 'User-Agent': UA }
      if (this.qingtingCookie) headers['Cookie'] = this.qingtingCookie

      const res = await fetch(url, { headers })
      const data = await res.json()
      const docs = data?.data?.data?.docs || data?.data?.docs || []

      return docs.map((t: any) => ({
        id: String(t.id),
        title: (t.title || '').replace(/<[^>]+>/g, ''),
        author: t.podcaster || t.podcaster_name || '',
        album: (t.channel_title || '').replace(/<[^>]+>/g, ''),
        duration: t.duration || 0,
        playUrl: '',
        coverUrl: t.cover || undefined,
        source: 'qingting' as const
      }))
    } catch (e) {
      console.error('QingTing search error:', e)
      return []
    }
  }

  private async qingtingGetPlayUrl(programId: string): Promise<string | null> {
    try {
      const url = `https://audio.qingting.fm/audiostream/redirect/0/${programId}?device_id=web`
      const headers: Record<string, string> = { 'User-Agent': UA }
      if (this.qingtingCookie) headers['Cookie'] = this.qingtingCookie
      const res = await fetch(url, { redirect: 'manual', headers })
      if (res.status === 302) return res.headers.get('location')
      if (res.status === 200) return url
      return null
    } catch {
      return null
    }
  }
}
