import { EdgeTTS } from 'node-edge-tts'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { app } from 'electron'

interface TTSResult {
  audioPath: string
  duration: number
  subtitles: Array<{ text: string; startMs: number; endMs: number }>
}

export class EdgeTTSProvider {
  private cacheDir: string

  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'audio-cache')
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  async synthesize(text: string, voice: string = 'zh-CN-YunxiNeural', options?: { rate?: string; pitch?: string }): Promise<TTSResult> {
    const hash = crypto.createHash('md5').update(text + voice).digest('hex')
    const audioPath = path.join(this.cacheDir, `${hash}.mp3`)
    const subtitlePath = path.join(this.cacheDir, `${hash}.sub.json`)

    if (fs.existsSync(audioPath) && fs.existsSync(subtitlePath)) {
      const subtitles = JSON.parse(fs.readFileSync(subtitlePath, 'utf-8'))
      const duration = await this.getAudioDuration(audioPath)
      return { audioPath, duration, subtitles }
    }

    const tts = new EdgeTTS({
      voice,
      lang: voice.startsWith('zh') ? 'zh-CN' : 'en-US',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: options?.rate || 'default',
      pitch: options?.pitch || 'default',
      saveSubtitles: true
    })

    await tts.ttsPromise(text, audioPath)

    let subtitles: Array<{ text: string; startMs: number; endMs: number }> = []

    // node-edge-tts outputs subtitles as {audioPath}.json with format [{part, start, end}]
    const rawSubPath = audioPath + '.json'
    if (fs.existsSync(rawSubPath)) {
      try {
        const raw: Array<{ part: string; start: number; end: number }> = JSON.parse(fs.readFileSync(rawSubPath, 'utf-8'))
        subtitles = raw.map(entry => ({
          text: entry.part,
          startMs: entry.start,
          endMs: entry.end
        }))
      } catch {
        subtitles = this.estimateSubtitles(text)
      }
      fs.unlinkSync(rawSubPath)
    } else {
      subtitles = this.estimateSubtitles(text)
    }

    fs.writeFileSync(subtitlePath, JSON.stringify(subtitles))
    const duration = await this.getAudioDuration(audioPath)
    return { audioPath, duration, subtitles }
  }

  async getVoices(): Promise<Array<{ name: string; locale: string; gender: string }>> {
    return [
      { name: 'zh-CN-YunxiNeural', locale: 'zh-CN', gender: '男' },
      { name: 'zh-CN-XiaoxiaoNeural', locale: 'zh-CN', gender: '女' },
      { name: 'zh-CN-YunjianNeural', locale: 'zh-CN', gender: '男' },
      { name: 'zh-CN-XiaoyiNeural', locale: 'zh-CN', gender: '女' },
      { name: 'zh-CN-YunyangNeural', locale: 'zh-CN', gender: '男' },
      { name: 'zh-CN-XiaomoNeural', locale: 'zh-CN', gender: '女' },
      { name: 'en-US-GuyNeural', locale: 'en-US', gender: 'Male' },
      { name: 'en-US-JennyNeural', locale: 'en-US', gender: 'Female' }
    ]
  }

  private estimateSubtitles(text: string): Array<{ text: string; startMs: number; endMs: number }> {
    const sentences = text.split(/([。！？.!?]+)/).reduce<string[]>((acc, part, i, arr) => {
      if (i % 2 === 0) {
        acc.push(part + (arr[i + 1] || ''))
      }
      return acc
    }, []).filter(s => s.trim())

    const charDurationMs = 150
    let offset = 0
    return sentences.map(s => {
      const duration = s.length * charDurationMs
      const entry = { text: s.trim(), startMs: offset, endMs: offset + duration }
      offset += duration
      return entry
    })
  }

  private async getAudioDuration(filePath: string): Promise<number> {
    try {
      const stat = fs.statSync(filePath)
      return Math.round(stat.size / 6000 * 1000)
    } catch {
      return 30000
    }
  }
}
