import { Minus, Square, X, Radio } from 'lucide-react'

export function TitleBar() {
  return (
    <div
      className="h-10 flex items-center justify-between px-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/60 backdrop-blur-xl"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Radio className="w-4 h-4 text-[var(--accent-cyan)]" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" style={{ animation: 'radio-dot 2s ease-in-out infinite' }} />
        </div>
        <span className="text-[12px] font-bold tracking-[0.25em] uppercase glow-text">SoundWave</span>
      </div>

      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={() => window.electronAPI.minimize()}
          className="w-10 h-10 flex items-center justify-center rounded-md text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electronAPI.maximize()}
          className="w-10 h-10 flex items-center justify-center rounded-md text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-all"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={() => window.electronAPI.close()}
          className="w-10 h-10 flex items-center justify-center rounded-md text-[var(--text-dim)] hover:text-white hover:bg-red-500/20 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
