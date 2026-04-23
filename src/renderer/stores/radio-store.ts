import { create } from 'zustand'

interface RadioState {
  isPlaying: boolean
  volume: number
  isMuted: boolean
  playbackRate: number
  bufferStatus: 'empty' | 'loading' | 'ready' | 'buffering'
  setPlaying: (playing: boolean) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setBufferStatus: (status: RadioState['bufferStatus']) => void
}

export const useRadioStore = create<RadioState>((set) => ({
  isPlaying: false,
  volume: 0.7,
  isMuted: false,
  playbackRate: 1,
  bufferStatus: 'empty',
  setPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setBufferStatus: (bufferStatus) => set({ bufferStatus })
}))
