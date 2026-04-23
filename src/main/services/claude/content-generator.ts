import { ClaudeService } from './claude-service'

interface ChannelConfig {
  systemPrompt: string
  contentStrategy: {
    segmentLength: string
    topicRotation: string[]
  }
  generationParams: {
    maxTokens: number
    temperature: number
  }
}

interface GenerationContext {
  channelId: string
  segmentIndex: number
  previousSummary?: string
  currentTopic?: string
}

interface ContentSegment {
  id: string
  channelId: string
  index: number
  text: string
  topic: string
  createdAt: number
}

export class ContentGenerator {
  private claude: ClaudeService

  constructor(claude: ClaudeService) {
    this.claude = claude
  }

  async generate(
    channel: ChannelConfig,
    context: GenerationContext,
    onSegment: (segment: ContentSegment) => void
  ): Promise<void> {
    const topic = context.currentTopic ||
      channel.contentStrategy.topicRotation[
        context.segmentIndex % channel.contentStrategy.topicRotation.length
      ]

    const userPrompt = this.buildUserPrompt(context, topic)

    let buffer = ''
    let segmentCount = 0

    for await (const chunk of this.claude.streamChat(
      channel.systemPrompt,
      userPrompt,
      channel.generationParams.maxTokens,
      channel.generationParams.temperature
    )) {
      buffer += chunk

      const segments = this.extractSegments(buffer)
      for (const segText of segments.complete) {
        const segment: ContentSegment = {
          id: `${context.channelId}-${Date.now()}-${segmentCount}`,
          channelId: context.channelId,
          index: context.segmentIndex + segmentCount,
          text: segText.trim(),
          topic,
          createdAt: Date.now()
        }
        onSegment(segment)
        segmentCount++
      }
      buffer = segments.remaining
    }

    if (buffer.trim().length > 20) {
      const segment: ContentSegment = {
        id: `${context.channelId}-${Date.now()}-${segmentCount}`,
        channelId: context.channelId,
        index: context.segmentIndex + segmentCount,
        text: buffer.trim(),
        topic,
        createdAt: Date.now()
      }
      onSegment(segment)
    }
  }

  private buildUserPrompt(context: GenerationContext, topic: string): string {
    let prompt = `请播报关于「${topic}」的内容。这是第 ${context.segmentIndex + 1} 段播报。`
    if (context.previousSummary) {
      prompt += `\n\n上一段摘要: ${context.previousSummary}`
    }
    prompt += '\n\n请直接开始播报，不要添加任何前缀说明。'
    return prompt
  }

  private extractSegments(text: string): { complete: string[]; remaining: string } {
    const complete: string[] = []
    const paragraphs = text.split(/\n\n+/)

    if (paragraphs.length <= 1) {
      return { complete: [], remaining: text }
    }

    const remaining = paragraphs.pop() || ''
    let current = ''

    for (const p of paragraphs) {
      current += (current ? '\n\n' : '') + p
      if (current.length >= 100) {
        complete.push(current)
        current = ''
      }
    }

    return {
      complete,
      remaining: current ? current + '\n\n' + remaining : remaining
    }
  }
}
