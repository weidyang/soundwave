import { useRadioStore } from '../../stores/radio-store'
import { useContentStore } from '../../stores/content-store'
import { useChannelStore } from '../../stores/channel-store'

export function StatusBar() {
  const isPlaying = useRadioStore(s => s.isPlaying)
  const isGenerating = useContentStore(s => s.isGenerating)
  const channel = useChannelStore(s => s.getCurrentChannel())

  return (
    <div className="h-6 flex items-center justify-between px-5 text-[9px] tracking-wider uppercase text-[var(--text-dim)] border-t border-[var(--border-color)] bg-[var(--bg-primary)]/60 backdrop-blur-xl relative z-10 font-mono">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[var(--accent-cyan)] animate-breathe' : 'bg-[var(--text-dim)]'}`} />
          {isPlaying ? 'streaming' : 'standby'}
        </span>
        {isGenerating && (
          <span className="text-[var(--accent-cyan)] animate-pulse">syncing</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>{channel?.frequency || ''}</span>
        <span>SoundWave v1.0</span>
      </div>
    </div>
  )
}
