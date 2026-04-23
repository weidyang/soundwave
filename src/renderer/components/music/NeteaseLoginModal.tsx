import { useState, useEffect, useRef } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useMusicStore } from '../../stores/music-store'

interface Props {
  onClose: () => void
}

type Tab = 'netease' | 'qq'

export function NeteaseLoginModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('netease')
  const [qrImg, setQrImg] = useState('')
  const [qrKey, setQrKey] = useState('')
  const [qrStatus, setQrStatus] = useState<'loading' | 'waiting' | 'scanned' | 'success' | 'expired'>('loading')
  const pollingRef = useRef<any>(null)
  const setNeteaseLoggedIn = useMusicStore(s => s.setNeteaseLoggedIn)
  const setQQLoggedIn = useMusicStore(s => s.setQQLoggedIn)
  const neteaseLoggedIn = useMusicStore(s => s.neteaseLoggedIn)
  const qqLoggedIn = useMusicStore(s => s.qqLoggedIn)

  // NetEase QR login
  const generateQR = async () => {
    setQrStatus('loading')
    setQrImg('')
    try {
      const result = await window.electronAPI.neteaseQRKey()
      if (result) {
        setQrImg(result.qrimg)
        setQrKey(result.key)
        setQrStatus('waiting')
        startPolling(result.key)
      } else {
        setQrStatus('expired')
      }
    } catch {
      setQrStatus('expired')
    }
  }

  useEffect(() => {
    if (tab === 'netease' && !neteaseLoggedIn) {
      generateQR()
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [tab])

  const startPolling = (key: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await window.electronAPI.neteaseQRCheck(key)
        if (res.code === 802) setQrStatus('scanned')
        else if (res.code === 803) {
          setQrStatus('success')
          setNeteaseLoggedIn(true)
          clearInterval(pollingRef.current)
        } else if (res.code === 800) {
          setQrStatus('expired')
          clearInterval(pollingRef.current)
        }
      } catch {}
    }, 2000)
  }

  const handleQQWebLogin = async () => {
    try {
      const cookie = await window.electronAPI.qqWebLogin()
      if (cookie) {
        await window.electronAPI.setQQCookie(cookie)
        setQQLoggedIn(true)
      }
    } catch (e) {
      console.error('QQ login failed:', e)
    }
  }

  const handleLogout = async (type: 'netease' | 'qq') => {
    if (type === 'netease') {
      await window.electronAPI.setNeteaseCookie('')
      setNeteaseLoggedIn(false)
      if (tab === 'netease') generateQR()
    } else {
      await window.electronAPI.setQQCookie('')
      setQQLoggedIn(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-[400px] bg-[#080a1e] border border-[var(--border-bright)] rounded-xl shadow-2xl overflow-hidden z-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)]">
          <span className="font-semibold text-sm">音乐账号登录</span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--border-color)]">
          <button onClick={() => setTab('netease')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors relative ${tab === 'netease' ? 'text-red-400' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'}`}>
            <span>网易云音乐</span>
            {neteaseLoggedIn && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
            {tab === 'netease' && <div className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-red-400 rounded-full" />}
          </button>
          <button onClick={() => setTab('qq')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors relative ${tab === 'qq' ? 'text-green-400' : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'}`}>
            <span>QQ音乐</span>
            {qqLoggedIn && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
            {tab === 'qq' && <div className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-green-400 rounded-full" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* NetEase */}
          {tab === 'netease' && (
            <div className="flex flex-col items-center gap-4">
              {neteaseLoggedIn ? (
                <>
                  <CheckCircle2 className="w-14 h-14 text-green-400" />
                  <p className="text-sm font-medium text-green-400">网易云音乐已登录</p>
                  <p className="text-[11px] text-[var(--text-dim)]">可播放已购买的 VIP 歌曲和个人歌单</p>
                  <button onClick={() => handleLogout('netease')}
                    className="px-4 py-1.5 rounded-lg text-xs text-[var(--text-dim)] border border-[var(--border-color)] hover:bg-white/5 transition-colors">
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <div className="w-48 h-48 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg">
                    {qrStatus === 'loading' ? (
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    ) : qrStatus === 'success' ? (
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    ) : qrStatus === 'expired' ? (
                      <button onClick={generateQR} className="flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs">已过期，点击刷新</span>
                      </button>
                    ) : qrImg ? (
                      <img src={qrImg} alt="QR Code" className="w-full h-full" />
                    ) : (
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-center text-[var(--text-dim)]">
                    {qrStatus === 'waiting' && '打开网易云音乐 App 扫码登录'}
                    {qrStatus === 'scanned' && '已扫码，请在手机上确认…'}
                    {qrStatus === 'success' && '登录成功！'}
                    {qrStatus === 'expired' && '二维码已过期'}
                    {qrStatus === 'loading' && '正在生成二维码…'}
                  </p>
                  {qrStatus === 'waiting' && (
                    <button onClick={generateQR}
                      className="flex items-center gap-1 text-[11px] text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">
                      <RefreshCw className="w-3 h-3" /> 刷新二维码
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* QQ Music */}
          {tab === 'qq' && (
            <div className="flex flex-col items-center gap-4">
              {qqLoggedIn ? (
                <>
                  <CheckCircle2 className="w-14 h-14 text-green-400" />
                  <p className="text-sm font-medium text-green-400">QQ音乐已登录</p>
                  <p className="text-[11px] text-[var(--text-dim)]">可播放已购买的绿钻歌曲</p>
                  <button onClick={() => handleLogout('qq')}
                    className="px-4 py-1.5 rounded-lg text-xs text-[var(--text-dim)] border border-[var(--border-color)] hover:bg-white/5 transition-colors">
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <span className="text-3xl">🎵</span>
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-medium">QQ音乐网页登录</p>
                    <p className="text-[11px] text-[var(--text-dim)] leading-relaxed max-w-[280px]">
                      点击下方按钮将打开 QQ音乐登录页面，<br/>登录成功后自动获取授权
                    </p>
                  </div>
                  <button onClick={handleQQWebLogin}
                    className="w-full py-2.5 rounded-xl bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors border border-green-500/20">
                    打开 QQ音乐登录
                  </button>
                  <p className="text-[10px] text-[var(--text-dim)] text-center">
                    数据仅保存在本地，不会上传到任何服务器
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
