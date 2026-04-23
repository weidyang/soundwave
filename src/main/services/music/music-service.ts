import fs from 'fs'
import path from 'path'

interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  filePath: string
}

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma'])

export class MusicService {
  async scanFolder(folderPath: string): Promise<MusicTrack[]> {
    const tracks: MusicTrack[] = []

    if (!fs.existsSync(folderPath)) return tracks

    const files = this.walkDir(folderPath)

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase()
      if (!AUDIO_EXTENSIONS.has(ext)) continue

      const basename = path.basename(filePath, ext)
      const parts = basename.split(' - ')

      tracks.push({
        id: Buffer.from(filePath).toString('base64url'),
        title: parts.length > 1 ? parts[1].trim() : basename,
        artist: parts.length > 1 ? parts[0].trim() : '未知艺术家',
        album: path.basename(path.dirname(filePath)),
        duration: 0,
        filePath
      })
    }

    return tracks
  }

  private walkDir(dir: string, maxDepth = 3, depth = 0): string[] {
    if (depth > maxDepth) return []
    const results: string[] = []

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          results.push(...this.walkDir(fullPath, maxDepth, depth + 1))
        } else if (entry.isFile()) {
          results.push(fullPath)
        }
      }
    } catch {
      // skip inaccessible dirs
    }

    return results
  }
}
