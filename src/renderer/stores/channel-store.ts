import { create } from 'zustand'

interface ChannelConfig {
  id: string
  name: string
  icon: string
  frequency: string
  description: string
  type?: string
  voice: any
  systemPrompt: string | null
  contentStrategy: any
  generationParams: any
}

interface ChannelState {
  channels: ChannelConfig[]
  currentChannelId: string
  setChannels: (channels: ChannelConfig[]) => void
  setCurrentChannel: (id: string) => void
  getCurrentChannel: () => ChannelConfig | undefined
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  currentChannelId: 'music',
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (id) => set({ currentChannelId: id }),
  getCurrentChannel: () => get().channels.find(c => c.id === get().currentChannelId)
}))
