import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, X, Trash2, Music, ListMusic } from 'lucide-react'
import { useMusicStore } from '../../stores/music-store'
import { useRadioStore } from '../../stores/radio-store'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  action?: {
    type: string
    tracks?: any[]
    text?: string
  }
}

interface Props {
  onClose: () => void
  onPlayTracks: (tracks: any[]) => void
}

export function AssistantPanel({ onClose, onPlayTracks }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好！我是 SoundWave AI 助手。跟我说想听什么，我来帮你找。' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentTrack = useMusicStore(s => s.getCurrentTrack())
  const isPlaying = useRadioStore(s => s.isPlaying)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const context = currentTrack ? { currentTrack } : undefined
      const reply = await window.electronAPI.assistantChat(text, context)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply.content,
        action: reply.action
      }])

      // Auto-play if tracks returned
      if (reply.action?.type === 'play_tracks' && reply.action.tracks?.length) {
        onPlayTracks(reply.action.tracks)
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '出错了：' + (e.message || '请检查 API 设置')
      }])
    } finally {
      setLoading(false)
    }
  }

  const handlePlaylistPlay = (tracks: any[]) => {
    onPlayTracks(tracks)
  }

  const handleClear = async () => {
    await window.electronAPI.assistantClear()
    setMessages([
      { role: 'assistant', content: '对话已清除。有什么想听的吗？' }
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-[340px] h-[420px] mr-4 mb-16 flex flex-col bg-[#080a1e] border border-[var(--border-bright)] rounded-xl shadow-2xl overflow-hidden z-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-[#0a0e24]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span className="text-xs font-semibold">AI 助手</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={handleClear} className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors" title="清除对话">
              <Trash2 className="w-3 h-3" />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--accent-amber)]/15 text-[var(--text-primary)] rounded-br-sm'
                  : 'bg-[#0c0e24] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Playlist action card */}
                {msg.action?.type === 'show_playlist' && msg.action.tracks?.length ? (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-[var(--accent-cyan)] font-medium flex items-center gap-1">
                        <ListMusic className="w-3 h-3" />
                        {msg.action.text || '为你定制的歌单'} · {msg.action.tracks.length} 首
                      </span>
                      <button
                        onClick={() => handlePlaylistPlay(msg.action!.tracks!)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/25 transition-colors"
                      >
                        全部播放
                      </button>
                    </div>
                    <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                      {msg.action.tracks.slice(0, 8).map((t, j) => (
                        <div key={j} className="text-[11px] text-[var(--text-dim)] truncate">
                          {j + 1}. {t.title} - {t.artist}
                        </div>
                      ))}
                      {msg.action.tracks.length > 8 && (
                        <div className="text-[10px] text-[var(--text-dim)]">...还有 {msg.action.tracks.length - 8} 首</div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Search result card */}
                {msg.action?.type === 'play_tracks' && msg.action.tracks?.length ? (
                  <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--accent-green)]">
                      已找到 {msg.action.tracks.length} 首歌曲，正在播放
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#0c0e24] border border-[var(--border-color)] rounded-xl rounded-bl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-[var(--accent-cyan)] animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-2.5 py-2 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="想听什么..."
              disabled={loading}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0c0e24] border border-[var(--border-color)] text-xs placeholder:text-[var(--text-dim)] focus:border-[var(--accent-cyan)]/40 focus:outline-none disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--accent-amber)] text-[var(--bg-primary)] hover:brightness-110 disabled:opacity-30 transition-all flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 mt-1 px-0.5">
            {['推荐轻松的歌', '下雨天听什么', '来点摇滚'].map(hint => (
              <button
                key={hint}
                onClick={() => { setInput(hint); inputRef.current?.focus() }}
                className="text-[9px] text-[var(--text-dim)] hover:text-[var(--accent-cyan)] transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
