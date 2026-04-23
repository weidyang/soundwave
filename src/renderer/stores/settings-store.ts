import { create } from 'zustand'

interface SettingsState {
  isOpen: boolean
  ttsProvider: string
  aiProvider: {
    baseUrl: string
    apiKey: string
    model: string
  }
  theme: string
  musicFolders: string[]
  toggleOpen: () => void
  setAIProvider: (provider: Partial<SettingsState['aiProvider']>) => void
  load: () => Promise<void>
  save: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isOpen: false,
  ttsProvider: 'edge-tts',
  aiProvider: {
    baseUrl: 'https://api.anthropic.com',
    apiKey: '',
    model: 'claude-sonnet-4-20250514'
  },
  theme: 'retro',
  musicFolders: [],

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

  setAIProvider: (provider) => set((s) => ({
    aiProvider: { ...s.aiProvider, ...provider }
  })),

  load: async () => {
    const settings = await window.electronAPI.getSettings()
    set({
      ttsProvider: settings.ttsProvider || 'edge-tts',
      aiProvider: settings.aiProvider || { baseUrl: 'https://api.anthropic.com', apiKey: '', model: 'claude-sonnet-4-20250514' },
      theme: settings.theme || 'retro',
      musicFolders: settings.musicFolders || []
    })
  },

  save: async () => {
    const { ttsProvider, aiProvider, theme, musicFolders } = get()
    await window.electronAPI.setSettings({ ttsProvider, aiProvider, theme, musicFolders })
  }
}))
