import { useState } from 'react'
import { X, CheckCircle2, ExternalLink } from 'lucide-react'

interface Props {
  onClose: () => void
  xmlyLoggedIn: boolean
  qtLoggedIn: boolean
  onXmlyLogin: () => Promise<void>
  onQtLogin: () => Promise<void>
  onLogout: (platform: 'ximalaya' | 'qingting') => Promise<void>
}

type Tab = 'ximalaya' | 'qingting'

export function PodcastLoginModal({ onClose, xmlyLoggedIn, qtLoggedIn, onXmlyLogin, onQtLogin, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('ximalaya')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (platform: Tab) => {
    setLoading(true)
    try {
      if (platform === 'ximalaya') await onXmlyLogin()
      else await onQtLogin()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-[400px] bg-[#080a1e] border border-[var(--border-bright)] rounded-xl shadow-2xl z-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)]">
          <span className="font-semibold text-sm">播客平台登录</span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--border-color)]">
          <button onClick={() => setTab('ximalaya')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors relative ${tab === 'ximalaya' ? 'text-orange-400' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'}`}>
            <span>喜马拉雅</span>
            {xmlyLoggedIn && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />}
            {tab === 'ximalaya' && <div className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.5)]" />}
          </button>
          <button onClick={() => setTab('qingting')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors relative ${tab === 'qingting' ? 'text-green-400' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'}`}>
            <span>蜻蜓FM</span>
            {qtLoggedIn && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />}
            {tab === 'qingting' && <div className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'ximalaya' && (
            <div className="flex flex-col items-center gap-4">
              {xmlyLoggedIn ? (
                <>
                  <CheckCircle2 className="w-14 h-14 text-orange-400" />
                  <p className="text-sm font-medium text-orange-400">喜马拉雅已登录</p>
                  <p className="text-[11px] text-[var(--text-dim)]">可搜索和播放喜马拉雅内容</p>
                  <button onClick={() => onLogout('ximalaya')}
                    className="px-4 py-1.5 rounded-lg text-xs text-[var(--text-dim)] border border-[var(--border-color)] hover:bg-white/5 hover:text-[var(--accent-red)] transition-colors">
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                    <span className="text-3xl">🎧</span>
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-medium">喜马拉雅网页登录</p>
                    <p className="text-[11px] text-[var(--text-dim)] leading-relaxed max-w-[280px]">
                      点击下方按钮打开喜马拉雅登录页面，登录后自动获取授权
                    </p>
                  </div>
                  <button onClick={() => handleLogin('ximalaya')} disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-colors border border-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {loading ? '等待登录...' : '打开喜马拉雅登录'}
                  </button>
                </>
              )}
            </div>
          )}

          {tab === 'qingting' && (
            <div className="flex flex-col items-center gap-4">
              {qtLoggedIn ? (
                <>
                  <CheckCircle2 className="w-14 h-14 text-green-400" />
                  <p className="text-sm font-medium text-green-400">蜻蜓FM已登录</p>
                  <p className="text-[11px] text-[var(--text-dim)]">可搜索和播放蜻蜓FM内容</p>
                  <button onClick={() => onLogout('qingting')}
                    className="px-4 py-1.5 rounded-lg text-xs text-[var(--text-dim)] border border-[var(--border-color)] hover:bg-white/5 hover:text-[var(--accent-red)] transition-colors">
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <span className="text-3xl">📻</span>
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-medium">蜻蜓FM网页登录</p>
                    <p className="text-[11px] text-[var(--text-dim)] leading-relaxed max-w-[280px]">
                      点击下方按钮打开蜻蜓FM页面，登录后自动获取授权
                    </p>
                  </div>
                  <button onClick={() => handleLogin('qingting')} disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors border border-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {loading ? '等待登录...' : '打开蜻蜓FM登录'}
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-[10px] text-[var(--text-dim)] text-center mt-4">
            数据仅保存在本地，不会上传到任何服务器
          </p>
        </div>
      </div>
    </div>
  )
}
