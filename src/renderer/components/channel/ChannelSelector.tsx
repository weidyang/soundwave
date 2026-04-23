import { useChannelStore } from '../../stores/channel-store'
import { useSettingsStore } from '../../stores/settings-store'
import { useRadioStore } from '../../stores/radio-store'
import { Music, Headphones, Settings } from 'lucide-react'

const iconMap: Record<string, any> = {
  music: Music,
  podcast: Headphones
}

export function ChannelSelector() {
  const { channels, currentChannelId, setCurrentChannel } = useChannelStore()
  const toggleSettings = useSettingsStore(s => s.toggleOpen)
  const setPlaying = useRadioStore(s => s.setPlaying)

  const handleChannelClick = (id: string) => {
    if (id === currentChannelId) return
    setPlaying(false)
    setTimeout(() => setCurrentChannel(id), 100)
  }

  return (
    <div className="flex items-center gap-2">
      {channels.map(ch => {
        const Icon = iconMap[ch.icon] || Music
        const isActive = ch.id === currentChannelId

        return (
          <button
            key={ch.id}
            onClick={() => handleChannelClick(ch.id)}
            className={`channel-btn ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4" />
            <span>{ch.name}</span>
          </button>
        )
      })}

      <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

      <button
        onClick={toggleSettings}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-dim)] transition-all flex-shrink-0"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}
