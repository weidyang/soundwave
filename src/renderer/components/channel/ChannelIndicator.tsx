import { useChannelStore } from '../../stores/channel-store'
import { useRadioStore } from '../../stores/radio-store'

export function ChannelIndicator() {
  const channel = useChannelStore(s => s.getCurrentChannel())
  const isPlaying = useRadioStore(s => s.isPlaying)

  if (!channel) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[var(--accent-cyan)]' : 'bg-[var(--text-dim)]'}`}
            style={isPlaying ? { animation: 'radio-dot 1.5s ease-in-out infinite' } : undefined}
          />
        </div>
        <span className="text-[15px] font-bold tracking-wide glow-text">{channel.name}</span>
        <span className="text-[10px] text-[var(--text-dim)] font-mono tracking-[0.15em]">{channel.frequency}</span>
      </div>
      <div className="flex items-center gap-2">
        {isPlaying && (
          <div className="flex items-center gap-[3px]">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-[2px] rounded-full bg-[var(--accent-cyan)]"
                style={{
                  animation: `bar-dance ${0.4 + i * 0.15}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
        <span className={`text-[9px] font-mono tracking-[0.2em] uppercase ${isPlaying ? 'text-[var(--accent-cyan)] glow-text' : 'text-[var(--text-dim)]'}`}>
          {isPlaying ? 'LIVE' : 'IDLE'}
        </span>
      </div>
    </div>
  )
}
