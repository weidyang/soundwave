import { ipcMain, dialog, app, BrowserWindow, session } from 'electron'
import { ClaudeService } from '../services/claude/claude-service'
import { ContentGenerator } from '../services/claude/content-generator'
import { EdgeTTSProvider } from '../services/tts/edge-tts-provider'
import { TTSManager } from '../services/tts/tts-manager'
import { MusicService } from '../services/music/music-service'
import { OnlineMusicManager } from '../services/music/online-music-manager'
import { LyricService } from '../services/music/lyric-service'
import { PodcastService } from '../services/podcast/podcast-service'
import { AssistantService } from '../services/assistant/assistant-service'
import { AppStore } from '../store/app-store'
import path from 'path'
import fs from 'fs'

let claudeService: ClaudeService
let contentGenerator: ContentGenerator
let ttsManager: TTSManager
let musicService: MusicService
let onlineMusic: OnlineMusicManager
let lyricService: LyricService
let podcastService: PodcastService
let assistantService: AssistantService | null = null
let appStore: AppStore

function loadChannels() {
  let channelsDir = path.join(__dirname, '../../channels')
  if (!fs.existsSync(channelsDir)) {
    channelsDir = path.join(app.getAppPath(), 'channels')
  }
  if (!fs.existsSync(channelsDir)) return []
  return fs.readdirSync(channelsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(channelsDir, f), 'utf-8')))
}

export function registerIpcHandlers(): void {
  appStore = new AppStore()
  const edgeTTS = new EdgeTTSProvider()
  ttsManager = new TTSManager(edgeTTS)
  musicService = new MusicService()
  onlineMusic = new OnlineMusicManager()
  lyricService = new LyricService()
  podcastService = new PodcastService()

  // Restore saved cookies
  const settings = appStore.getAll() as any
  if (settings.neteaseCookie) onlineMusic.setNeteaseCookie(settings.neteaseCookie)
  if (settings.qqCookie) onlineMusic.setQQCookie(settings.qqCookie)
  if (settings.ximalayaCookie) podcastService.setXimalayaCookie(settings.ximalayaCookie)
  if (settings.qingtingCookie) podcastService.setQingtingCookie(settings.qingtingCookie)

  // Settings
  ipcMain.handle('settings:get', () => appStore.getAll())
  ipcMain.handle('settings:set', (_e, s) => { appStore.setAll(s); return true })

  // Channels
  ipcMain.handle('channels:list', () => loadChannels())

  // AI Content Generation
  ipcMain.handle('claude:generate', async (event, channelConfig, context) => {
    const s = appStore.getAll()
    if (!s.aiProvider?.apiKey) throw new Error('请先在设置中配置 API Key')

    claudeService = new ClaudeService(s.aiProvider.baseUrl, s.aiProvider.apiKey, s.aiProvider.model)
    contentGenerator = new ContentGenerator(claudeService)

    const segments: any[] = []
    const onSegment = (segment: any) => {
      segments.push(segment)
      event.sender.send('claude:content-stream', segment)
    }
    await contentGenerator.generate(channelConfig, context, onSegment)
    return segments
  })

  // TTS
  ipcMain.handle('tts:synthesize', async (_e, text, voice, options) => ttsManager.synthesize(text, voice, options))
  ipcMain.handle('tts:voices', async () => ttsManager.getVoices())

  // Local Music
  ipcMain.handle('music:scan-folder', async (_e, folderPath) => musicService.scanFolder(folderPath))
  ipcMain.handle('music:pick-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'], title: '选择音乐文件夹' })
    if (result.canceled || !result.filePaths.length) return null
    const folderPath = result.filePaths[0]
    return { folderPath, tracks: await musicService.scanFolder(folderPath) }
  })
  ipcMain.handle('music:get-track-url', (_e, filePath) => {
    return 'local-audio://' + encodeURIComponent(filePath.replace(/\\/g, '/'))
  })

  // Lyrics
  ipcMain.handle('music:get-lyrics', async (_e, track: any) => {
    return lyricService.getLyrics(track)
  })

  // ===== Online Music (Multi-source aggregation) =====

  // ===== Podcast (喜马拉雅/蜻蜓FM) =====
  ipcMain.handle('podcast:search', async (_e, keyword: string, limit?: number) => {
    return podcastService.search(keyword, limit || 20)
  })
  ipcMain.handle('podcast:get-url', async (_e, track: any) => {
    return podcastService.getPlayUrl(track)
  })
  ipcMain.handle('podcast:categories', async () => {
    return podcastService.getCategories()
  })
  ipcMain.handle('podcast:category-tracks', async (_e, categoryId: string) => {
    return podcastService.getCategoryTracks(categoryId)
  })
  ipcMain.handle('podcast:ranking', async () => {
    return podcastService.getRanking()
  })
  ipcMain.handle('podcast:login-status', () => {
    return podcastService.getLoginStatus()
  })

  // Logout
  ipcMain.handle('podcast:logout', (_e, platform: string) => {
    if (platform === 'ximalaya') {
      podcastService.setXimalayaCookie('')
      appStore.setAll({ ximalayaCookie: '' } as any)
    } else if (platform === 'qingting') {
      podcastService.setQingtingCookie('')
      appStore.setAll({ qingtingCookie: '' } as any)
    }
    return true
  })

  // Ximalaya web login
  ipcMain.handle('podcast:ximalaya-web-login', async () => {
    return new Promise<string | null>((resolve) => {
      const loginSession = session.fromPartition('ximalaya-login')
      const loginWin = new BrowserWindow({
        width: 900, height: 650, title: '喜马拉雅 - 请登录后关闭窗口', autoHideMenuBar: true,
        webPreferences: { session: loginSession, nodeIntegration: false, contextIsolation: true }
      })
      loginWin.loadURL('https://www.ximalaya.com/passport/login')
      let resolved = false
      // Check for real login cookies (not tracking cookies)
      const poll = setInterval(async () => {
        try {
          const cookies = await loginSession.cookies.get({ domain: '.ximalaya.com' })
          const hasLogin = cookies.some(c => c.name === '1&_token') &&
                           cookies.some(c => c.name === 'x_xmly_traffic')
          if (hasLogin && !resolved) {
            const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
            resolved = true; clearInterval(poll)
            podcastService.setXimalayaCookie(cookieStr)
            appStore.setAll({ ximalayaCookie: cookieStr } as any)
            setTimeout(() => loginWin.close(), 1000)
            resolve(cookieStr)
          }
        } catch {}
      }, 3000)
      loginWin.on('closed', () => {
        clearInterval(poll)
        if (!resolved) {
          // User closed manually - still grab cookies in case they logged in
          loginSession.cookies.get({ domain: '.ximalaya.com' }).then(cookies => {
            const hasLogin = cookies.some(c => c.name === '1&_token')
            if (hasLogin) {
              const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
              podcastService.setXimalayaCookie(cookieStr)
              appStore.setAll({ ximalayaCookie: cookieStr } as any)
              resolve(cookieStr)
            } else {
              resolve(null)
            }
          }).catch(() => resolve(null))
        }
      })
    })
  })

  // QingTing web login
  ipcMain.handle('podcast:qingting-web-login', async () => {
    return new Promise<string | null>((resolve) => {
      const loginSession = session.fromPartition('qingting-login')
      const loginWin = new BrowserWindow({
        width: 900, height: 650, title: '蜻蜓FM - 请登录后关闭窗口', autoHideMenuBar: true,
        webPreferences: { session: loginSession, nodeIntegration: false, contextIsolation: true }
      })
      loginWin.loadURL('https://www.qingting.fm/')
      let resolved = false
      const poll = setInterval(async () => {
        try {
          const cookies = await loginSession.cookies.get({ domain: '.qingting.fm' })
          const hasAuth = cookies.some(c => c.name === 'qingting_id') &&
                          cookies.some(c => c.name === 'access_token')
          if (hasAuth && !resolved) {
            const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
            resolved = true; clearInterval(poll)
            podcastService.setQingtingCookie(cookieStr)
            appStore.setAll({ qingtingCookie: cookieStr } as any)
            setTimeout(() => loginWin.close(), 1000)
            resolve(cookieStr)
          }
        } catch {}
      }, 3000)
      loginWin.on('closed', () => {
        clearInterval(poll)
        if (!resolved) {
          loginSession.cookies.get({ domain: '.qingting.fm' }).then(cookies => {
            const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
            if (cookieStr.length > 50) {
              podcastService.setQingtingCookie(cookieStr)
              appStore.setAll({ qingtingCookie: cookieStr } as any)
              resolve(cookieStr)
            } else {
              resolve(null)
            }
          }).catch(() => resolve(null))
        }
      })
    })
  })

  // Search (aggregates NetEase + QQ)
  ipcMain.handle('online-music:search', async (_e, keywords: string, limit?: number) => {
    return onlineMusic.search(keywords, limit || 20)
  })

  // Get playable URL for a track
  ipcMain.handle('online-music:get-url', async (_e, track: any) => {
    return onlineMusic.getSongUrl(track)
  })

  // Login status
  ipcMain.handle('online-music:login-status', () => {
    return onlineMusic.getLoginStatus()
  })

  // NetEase QR login flow
  ipcMain.handle('online-music:netease-qr-key', async () => {
    return onlineMusic.getNeteaseQRKey()
  })

  ipcMain.handle('online-music:netease-qr-check', async (_e, key: string) => {
    const result = await onlineMusic.checkNeteaseQRLogin(key)
    if (result.code === 803 && result.cookie) {
      appStore.setAll({ neteaseCookie: result.cookie } as any)
    }
    return result
  })

  // Manual cookie login
  ipcMain.handle('online-music:set-netease-cookie', (_e, cookie: string) => {
    onlineMusic.setNeteaseCookie(cookie)
    appStore.setAll({ neteaseCookie: cookie } as any)
    return true
  })

  ipcMain.handle('online-music:set-qq-cookie', (_e, cookie: string) => {
    onlineMusic.setQQCookie(cookie)
    appStore.setAll({ qqCookie: cookie } as any)
    return true
  })

  // NetEase playlist
  ipcMain.handle('online-music:netease-playlists', async (_e, uid: string) => {
    return onlineMusic.netease.getUserPlaylists(uid)
  })

  ipcMain.handle('online-music:netease-playlist-tracks', async (_e, id: string) => {
    return onlineMusic.netease.getPlaylistTracks(id)
  })

  // ===== QQ Music Web Login =====
  ipcMain.handle('online-music:qq-web-login', async () => {
    return new Promise<string | null>((resolve) => {
      const loginSession = session.fromPartition('qq-login')

      const loginWin = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'QQ音乐登录',
        autoHideMenuBar: true,
        webPreferences: {
          session: loginSession,
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      loginWin.loadURL('https://y.qq.com/')

      let resolved = false

      // Poll cookies every 2s to detect login
      const pollInterval = setInterval(async () => {
        try {
          const cookies = await loginSession.cookies.get({ domain: '.qq.com' })
          const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
          const hasAuth = cookies.some(c => c.name === 'qqmusic_key' || c.name === 'qm_keyst' || c.name === 'Q_H_L')
          if (hasAuth && !resolved) {
            resolved = true
            clearInterval(pollInterval)
            onlineMusic.setQQCookie(cookieStr)
            appStore.setAll({ qqCookie: cookieStr } as any)
            loginWin.close()
            resolve(cookieStr)
          }
        } catch {}
      }, 2000)

      loginWin.on('closed', () => {
        clearInterval(pollInterval)
        if (!resolved) resolve(null)
      })
    })
  })

  // ===== Radio Modes =====
  ipcMain.handle('radio-mode:get-modes', () => onlineMusic.getRadioModes())
  ipcMain.handle('radio-mode:mood', async (_e, moodId: string) => onlineMusic.getMoodTracks(moodId))
  ipcMain.handle('radio-mode:genre', async (_e, genreId: string) => onlineMusic.getGenreTracks(genreId))
  ipcMain.handle('radio-mode:chart', async (_e, chartId: string) => onlineMusic.getChartTracks(chartId))
  ipcMain.handle('radio-mode:smart', async (_e, currentTrack?: any) => onlineMusic.getSmartRadio(currentTrack))

  // ===== AI Assistant =====
  function getAssistant(): AssistantService {
    const s = appStore.getAll() as any
    if (!s.aiProvider?.apiKey) throw new Error('请先在设置中配置 API Key')
    if (!assistantService) {
      const claude = new ClaudeService(s.aiProvider.baseUrl, s.aiProvider.apiKey, s.aiProvider.model)
      assistantService = new AssistantService(claude, onlineMusic)
    }
    return assistantService
  }

  ipcMain.handle('assistant:chat', async (_e, message: string, context?: any) => {
    return getAssistant().chat(message, context)
  })

  ipcMain.handle('assistant:clear', () => {
    assistantService?.clearHistory()
    return true
  })
}
