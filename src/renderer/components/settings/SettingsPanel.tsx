import { useState } from 'react'
import { X, Key, Globe, Bot, Palette } from 'lucide-react'
import { useSettingsStore } from '../../stores/settings-store'

export function SettingsPanel() {
  const { isOpen, toggleOpen, aiProvider, setAIProvider, save } = useSettingsStore()
  const [localBaseUrl, setLocalBaseUrl] = useState(aiProvider.baseUrl)
  const [localApiKey, setLocalApiKey] = useState(aiProvider.apiKey)
  const [localModel, setLocalModel] = useState(aiProvider.model)

  const handleSave = async () => {
    setAIProvider({
      baseUrl: localBaseUrl,
      apiKey: localApiKey,
      model: localModel
    })
    await save()
    toggleOpen()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={toggleOpen} />

      <div className="relative ml-auto w-80 h-full bg-[#060818] border-l border-[var(--border-bright)] flex flex-col shadow-2xl animate-slide-in-right z-10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <span className="font-semibold text-sm tracking-wide">设置</span>
          <button onClick={toggleOpen} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* AI Provider */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-cyan)] uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5" />
              AI 接口配置
            </h3>

            <div className="space-y-2">
              <label className="block text-xs text-[var(--text-dim)]">
                <Globe className="w-3 h-3 inline mr-1" />
                API Base URL
              </label>
              <input
                type="text"
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
                placeholder="https://api.anthropic.com"
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-[var(--text-dim)]">
                <Key className="w-3 h-3 inline mr-1" />
                API Key
              </label>
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-[var(--text-dim)]">
                <Bot className="w-3 h-3 inline mr-1" />
                模型
              </label>
              <input
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                placeholder="claude-sonnet-4-20250514"
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
              />
            </div>

            <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
              支持 OpenAI 兼容接口格式。填入你的 API 地址和密钥即可使用任意大模型服务。
            </p>
          </section>

          {/* TTS */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-cyan)] uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5" />
              语音合成
            </h3>
            <p className="text-xs text-[var(--text-dim)]">
              当前使用 Edge TTS（免费，微软 Neural 语音引擎）
            </p>
          </section>
        </div>

        <div className="p-4 border-t border-[var(--border-color)]">
          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg bg-[var(--accent-amber)] text-[var(--bg-primary)] font-semibold text-sm hover:brightness-110 transition-all"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}
