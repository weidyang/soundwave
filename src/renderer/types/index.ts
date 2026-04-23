export interface ChannelConfig {
  id: string
  name: string
  icon: string
  frequency: string
  description: string
  type?: 'ai' | 'music'
  voice: {
    edgeTTS: string
    rate?: string
    pitch?: string
  } | null
  systemPrompt: string | null
  contentStrategy: {
    segmentLength: string
    segmentsPerSession: number
    topicRotation: string[]
  } | null
  generationParams: {
    maxTokens: number
    temperature: number
  } | null
}

export interface ContentSegment {
  id: string
  channelId: string
  index: number
  text: string
  topic?: string
  createdAt: number
}

export interface AudioSegmentInfo {
  segmentId: string
  audioPath: string
  duration: number
  subtitles: SubtitleEntry[]
}

export interface SubtitleEntry {
  text: string
  startMs: number
  endMs: number
}

export interface GenerationContext {
  channelId: string
  segmentIndex: number
  previousSummary?: string
  currentTopic?: string
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  filePath: string
  coverArt?: string
}

export interface AppSettings {
  ttsProvider: 'edge-tts'
  aiProvider: {
    baseUrl: string
    apiKey: string
    model: string
  }
  defaultVoice: Record<string, string>
  theme: 'retro' | 'modern-dark'
  autoPlay: boolean
  cacheSize: number
  language: 'zh-CN' | 'en-US'
  musicFolders: string[]
}
