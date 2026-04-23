import { useContentStore } from '../../stores/content-store'
import { Loader2, Radio } from 'lucide-react'

export function ContentDisplay() {
  const { segments, currentSegmentIndex, currentWordIndex, isGenerating, generationError } = useContentStore()

  const currentSegment = segments[currentSegmentIndex]

  if (generationError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2 px-8">
          <p className="text-sm text-[var(--accent-red)]">{generationError}</p>
          <p className="text-xs text-[var(--text-dim)]">请检查设置中的 API 配置</p>
        </div>
      </div>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {isGenerating ? (
          <>
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-cyan)] opacity-60" />
              <div className="absolute inset-0 w-10 h-10 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)' }} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-[var(--text-secondary)]">AI 正在准备内容...</p>
              <p className="text-[11px] text-[var(--text-dim)]">首次加载需要几秒钟</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <Radio className="w-12 h-12 text-[var(--accent-amber)] opacity-40" />
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)', transform: 'scale(2)' }} />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-base font-medium glow-text tracking-wider">SoundWave</p>
              <p className="text-xs text-[var(--text-dim)]">点击播放按钮开始收听</p>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
      {segments.map((seg, segIdx) => {
        const isCurrent = segIdx === currentSegmentIndex
        const isPast = segIdx < currentSegmentIndex

        return (
          <div
            key={seg.id}
            className={`text-[13px] leading-[1.85] transition-all duration-500 rounded-lg px-3 py-2 ${
              isCurrent
                ? 'bg-[var(--accent-cyan-dim)] border-l-2 border-[var(--accent-cyan)]'
                : isPast
                ? 'opacity-40'
                : 'opacity-70'
            }`}
          >
            {isCurrent && currentSegment?.subtitles?.length ? (
              <p>
                {currentSegment.subtitles.map((sub, i) => (
                  <span
                    key={i}
                    className={`transition-all duration-150 ${
                      i === currentWordIndex
                        ? 'text-[var(--accent-cyan)] glow-text font-semibold'
                        : i < currentWordIndex
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {sub.text}
                  </span>
                ))}
              </p>
            ) : (
              <p className={isPast ? 'text-[var(--text-dim)]' : ''}>{seg.text}</p>
            )}

            {isCurrent && !seg.audioUrl && (
              <div className="flex items-center gap-1.5 mt-2 text-[var(--accent-cyan)]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[11px]">语音合成中...</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
