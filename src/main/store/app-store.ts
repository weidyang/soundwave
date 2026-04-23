import ElectronStore from 'electron-store'
const Store = (ElectronStore as any).default || ElectronStore

interface AppSettings {
  ttsProvider: string
  aiProvider: {
    baseUrl: string
    apiKey: string
    model: string
  }
  defaultVoice: Record<string, string>
  theme: string
  autoPlay: boolean
  cacheSize: number
  language: string
  musicFolders: string[]
}

const defaults: AppSettings = {
  ttsProvider: 'edge-tts',
  aiProvider: {
    baseUrl: 'https://api.anthropic.com',
    apiKey: '',
    model: 'claude-sonnet-4-20250514'
  },
  defaultVoice: {},
  theme: 'retro',
  autoPlay: true,
  cacheSize: 500,
  language: 'zh-CN',
  musicFolders: []
}

export class AppStore {
  private store: Store<AppSettings>

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'settings',
      defaults,
      encryptionKey: 'claude-ai-radio-v1'
    })
  }

  getAll(): AppSettings {
    return this.store.store
  }

  setAll(partial: Partial<AppSettings>): void {
    for (const [key, value] of Object.entries(partial)) {
      this.store.set(key as keyof AppSettings, value)
    }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key)
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value)
  }
}
