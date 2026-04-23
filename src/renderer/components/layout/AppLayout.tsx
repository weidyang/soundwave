import { useState, useCallback } from 'react'
import { TitleBar } from './TitleBar'
import { StatusBar } from './StatusBar'
import { Visualizer } from '../radio/Visualizer'
import { ChannelIndicator } from '../channel/ChannelIndicator'
import { PlaybackControls } from '../radio/PlaybackControls'
import { ChannelSelector } from '../channel/ChannelSelector'
import { SettingsPanel } from '../settings/SettingsPanel'
import { MusicPlayer } from '../music/MusicPlayer'
import { PodcastPlayer } from '../podcast/PodcastPlayer'
import { AssistantPanel } from '../assistant/AssistantPanel'
import { useChannelStore } from '../../stores/channel-store'
import { useSettingsStore } from '../../stores/settings-store'
import { useMusicStore } from '../../stores/music-store'
import { Sparkles } from 'lucide-react'

export function AppLayout() {
  const currentChannel = useChannelStore(s => s.getCurrentChannel())
  const isSettingsOpen = useSettingsStore(s => s.isOpen)
  const [showAssistant, setShowAssistant] = useState(false)
  const { setPlaylist, setCurrentTrackIndex } = useMusicStore()

  const channelType = currentChannel?.type || 'music'

  const handleAssistantPlayTracks = useCallback((tracks: any[]) => {
    setPlaylist(tracks)
    setCurrentTrackIndex(0)
    const musicChannel = useChannelStore.getState().channels.find(c => c.type === 'music')
    if (musicChannel) useChannelStore.getState().setCurrentChannel(musicChannel.id)
  }, [])

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <div className="noise-overlay" />

      <TitleBar />

      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3 pb-2 gap-3 relative z-10">
        {/* Top: Visualizer + Channel Info */}
        <div className="surface scan-lines p-4 flex flex-col gap-2.5">
          <ChannelIndicator />
          <Visualizer />
        </div>

        {/* Middle: Content area */}
        <div className="flex-1 surface p-4 overflow-hidden flex flex-col min-h-0 animate-fade-in">
          {channelType === 'music' && <MusicPlayer />}
          {channelType === 'podcast' && <PodcastPlayer />}
        </div>

        {/* Bottom: Controls + Channels */}
        <div className="surface-glow p-3 flex flex-col gap-3">
          <PlaybackControls />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ChannelSelector />
            </div>
            <div className="w-px h-8 bg-[var(--border-color)]" />
            <button
              onClick={() => setShowAssistant(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl surface hover:border-[var(--border-bright)] text-[var(--accent-cyan)] transition-all flex-shrink-0 hover:scale-110 hover:shadow-[0_0_16px_rgba(0,229,255,0.15)]"
              title="AI 助手"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <StatusBar />

      {isSettingsOpen && <SettingsPanel />}
      {showAssistant && (
        <AssistantPanel
          onClose={() => setShowAssistant(false)}
          onPlayTracks={handleAssistantPlayTracks}
        />
      )}
    </div>
  )
}
