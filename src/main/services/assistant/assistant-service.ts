import { ClaudeService } from '../claude/claude-service'
import { OnlineMusicManager } from '../music/online-music-manager'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  action?: AssistantAction
}

export interface AssistantAction {
  type: 'play_tracks' | 'show_playlist' | 'summary' | 'info' | 'none'
  tracks?: any[]
  text?: string
}

const SYSTEM_PROMPT = `你是 Claude AI Radio 的智能助手。你帮助用户在音乐电台和博客电台中找到想听的内容。

你的能力：
1. **点歌/搜歌** - 用户说想听什么歌、什么歌手，你提取关键词去搜索
2. **智能歌单** - 用户描述场景或心情，你生成一组搜索关键词来组合歌单
3. **内容摘要** - 用户问某个播客/博客内容讲了什么，你给出简短摘要
4. **歌曲信息** - 用户问当前歌曲信息，你提供相关介绍

回复规则：
- 用中文回复，简洁友好，像电台 DJ 一样自然
- 回复控制在 2-3 句话以内
- 你必须在回复中包含一个 JSON 动作块，格式如下（放在回复最末尾，单独一行）：

搜索/点歌时：
ACTION:{"type":"search","keywords":"搜索关键词"}

生成歌单时（多个关键词逐一搜索后合并）：
ACTION:{"type":"playlist","keywords":["关键词1","关键词2","关键词3"],"name":"歌单名称"}

纯聊天/信息回复时：
ACTION:{"type":"none"}

永远在最后一行输出 ACTION，不要省略。`

export class AssistantService {
  private claude: ClaudeService
  private musicManager: OnlineMusicManager
  private history: Array<{ role: string; content: string }> = []

  constructor(claude: ClaudeService, musicManager: OnlineMusicManager) {
    this.claude = claude
    this.musicManager = musicManager
  }

  async chat(userMessage: string, context?: { currentTrack?: any }): Promise<AssistantMessage> {
    let contextInfo = ''
    if (context?.currentTrack) {
      contextInfo = `\n[当前播放: ${context.currentTrack.title} - ${context.currentTrack.artist}]`
    }

    this.history.push({ role: 'user', content: userMessage + contextInfo })

    // Keep last 10 turns
    if (this.history.length > 20) {
      this.history = this.history.slice(-20)
    }

    const messagesForAPI = this.history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    let reply = ''
    try {
      reply = await this.claude.chat(
        SYSTEM_PROMPT,
        messagesForAPI.map(m => `${m.role}: ${m.content}`).join('\n'),
        512,
        0.7
      )
    } catch (e: any) {
      return {
        role: 'assistant',
        content: '抱歉，AI 助手暂时不可用，请检查 API 设置。',
        action: { type: 'none' }
      }
    }

    this.history.push({ role: 'assistant', content: reply })

    // Parse action from reply
    const action = await this.parseAndExecuteAction(reply)
    const cleanContent = reply.replace(/ACTION:\{.*\}$/m, '').trim()

    return {
      role: 'assistant',
      content: cleanContent,
      action
    }
  }

  private async parseAndExecuteAction(reply: string): Promise<AssistantAction> {
    const actionMatch = reply.match(/ACTION:(\{.*\})/)
    if (!actionMatch) return { type: 'none' }

    try {
      const parsed = JSON.parse(actionMatch[1])

      if (parsed.type === 'search' && parsed.keywords) {
        const tracks = await this.musicManager.search(parsed.keywords, 20)
        return { type: 'play_tracks', tracks }
      }

      if (parsed.type === 'playlist' && parsed.keywords) {
        const allTracks: any[] = []
        const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [parsed.keywords]

        for (const kw of keywords.slice(0, 5)) {
          const results = await this.musicManager.search(kw, 8)
          allTracks.push(...results)
        }

        // Deduplicate by id+source
        const seen = new Set<string>()
        const unique = allTracks.filter(t => {
          const key = `${t.source}-${t.id}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        // Shuffle
        for (let i = unique.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unique[i], unique[j]] = [unique[j], unique[i]]
        }

        return {
          type: 'show_playlist',
          tracks: unique,
          text: parsed.name || '为你定制的歌单'
        }
      }

      return { type: 'none' }
    } catch {
      return { type: 'none' }
    }
  }

  clearHistory() {
    this.history = []
  }
}
