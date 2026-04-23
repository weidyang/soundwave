import { EdgeTTSProvider } from './edge-tts-provider'

export class TTSManager {
  private provider: EdgeTTSProvider

  constructor(provider: EdgeTTSProvider) {
    this.provider = provider
  }

  async synthesize(text: string, voice?: string, options?: { rate?: string; pitch?: string }) {
    const result = await this.provider.synthesize(text, voice, options)
    return {
      audioUrl: 'local-audio://' + encodeURIComponent(result.audioPath.replace(/\\/g, '/')),
      audioPath: result.audioPath,
      duration: result.duration,
      subtitles: result.subtitles
    }
  }

  async getVoices() {
    return this.provider.getVoices()
  }
}
