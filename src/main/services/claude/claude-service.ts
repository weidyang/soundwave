export class ClaudeService {
  private baseUrl: string
  private apiKey: string
  private model: string

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.apiKey = apiKey
    this.model = model
  }

  async *streamChat(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = 1024,
    temperature: number = 0.7
  ): AsyncGenerator<string> {
    const url = `${this.baseUrl}/v1/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: true
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API 请求失败 (${response.status}): ${text}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // skip malformed JSON
        }
      }
    }
  }

  async chat(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = 1024,
    temperature: number = 0.7
  ): Promise<string> {
    let result = ''
    for await (const chunk of this.streamChat(systemPrompt, userMessage, maxTokens, temperature)) {
      result += chunk
    }
    return result
  }
}
