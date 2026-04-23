import { create } from 'zustand'

interface ContentSegment {
  id: string
  channelId: string
  index: number
  text: string
  topic?: string
  audioUrl?: string
  duration?: number
  subtitles?: Array<{ text: string; startMs: number; endMs: number }>
}

interface ContentState {
  segments: ContentSegment[]
  currentSegmentIndex: number
  currentWordIndex: number
  isGenerating: boolean
  generationError: string | null
  addSegment: (segment: ContentSegment) => void
  setCurrentSegmentIndex: (index: number) => void
  setCurrentWordIndex: (index: number) => void
  updateSegmentAudio: (segmentId: string, audio: { audioUrl: string; duration: number; subtitles: any[] }) => void
  setGenerating: (generating: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

export const useContentStore = create<ContentState>((set) => ({
  segments: [],
  currentSegmentIndex: 0,
  currentWordIndex: -1,
  isGenerating: false,
  generationError: null,

  addSegment: (segment) => set((s) => ({ segments: [...s.segments, segment] })),

  setCurrentSegmentIndex: (index) => set({ currentSegmentIndex: index, currentWordIndex: -1 }),

  setCurrentWordIndex: (index) => set({ currentWordIndex: index }),

  updateSegmentAudio: (segmentId, audio) =>
    set((s) => ({
      segments: s.segments.map(seg =>
        seg.id === segmentId ? { ...seg, ...audio } : seg
      )
    })),

  setGenerating: (isGenerating) => set({ isGenerating }),
  setError: (generationError) => set({ generationError }),
  clear: () => set({ segments: [], currentSegmentIndex: 0, currentWordIndex: -1 })
}))
