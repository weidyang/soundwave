import { useCallback, useEffect, useRef } from 'react'
import { useRadioStore } from '../../stores/radio-store'
import { useContentStore } from '../../stores/content-store'
import { useChannelStore } from '../../stores/channel-store'

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isPlaying, setPlaying, volume, isMuted, setBufferStatus } = useRadioStore()
  const { segments, currentSegmentIndex, setCurrentSegmentIndex, setCurrentWordIndex, setGenerating, addSegment, updateSegmentAudio, setError, clear } = useContentStore()
  const currentChannel = useChannelStore(s => s.getCurrentChannel())
  const isGeneratingRef = useRef(false)
  const channelIdRef = useRef('')

  const currentSegment = segments[currentSegmentIndex]

  const generateAndSynthesize = useCallback(async () => {
    if (!currentChannel || currentChannel.type === 'music' || isGeneratingRef.current) return
    if (!currentChannel.systemPrompt) return

    isGeneratingRef.current = true
    setGenerating(true)
    setBufferStatus('loading')

    try {
      const context = {
        channelId: currentChannel.id,
        segmentIndex: segments.length,
        previousSummary: segments.length > 0 ? segments[segments.length - 1]?.text?.slice(0, 100) : undefined
      }

      const cleanup = window.electronAPI.onContentStream(async (segment) => {
        addSegment(segment)

        try {
          const voice = currentChannel.voice?.edgeTTS || 'zh-CN-YunxiNeural'
          const audio = await window.electronAPI.synthesize(
            segment.text,
            voice,
            { rate: currentChannel.voice?.rate, pitch: currentChannel.voice?.pitch }
          )
          updateSegmentAudio(segment.id, audio)
          setBufferStatus('ready')
        } catch (err: any) {
          console.error('TTS synthesis failed:', err)
        }
      })

      await window.electronAPI.generateContent(currentChannel, context)
      cleanup()
    } catch (err: any) {
      setError(err.message)
    } finally {
      isGeneratingRef.current = false
      setGenerating(false)
    }
  }, [currentChannel, segments.length])

  // Auto-generate when play pressed and no content
  useEffect(() => {
    if (isPlaying && segments.length === 0 && currentChannel && currentChannel.type !== 'music') {
      generateAndSynthesize()
    }
  }, [isPlaying])

  // Handle channel switch
  useEffect(() => {
    if (currentChannel && currentChannel.id !== channelIdRef.current) {
      channelIdRef.current = currentChannel.id
      clear()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (isPlaying && currentChannel.type !== 'music') {
        generateAndSynthesize()
      }
    }
  }, [currentChannel?.id])

  // Play audio when segment has audioUrl
  useEffect(() => {
    if (!currentSegment?.audioUrl || !isPlaying) return

    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const audio = audioRef.current
    audio.src = currentSegment.audioUrl
    audio.volume = isMuted ? 0 : volume
    audio.play().catch(console.error)

    audio.onended = () => {
      if (currentSegmentIndex < segments.length - 1) {
        setCurrentSegmentIndex(currentSegmentIndex + 1)
      } else {
        generateAndSynthesize()
      }
    }

    // Subtitle sync
    const syncInterval = setInterval(() => {
      if (!currentSegment.subtitles?.length) return
      const time = audio.currentTime * 1000
      const idx = currentSegment.subtitles.findIndex(
        (s) => time >= s.startMs && time <= s.endMs
      )
      if (idx !== -1) setCurrentWordIndex(idx)
    }, 50)

    return () => clearInterval(syncInterval)
  }, [currentSegment?.audioUrl, currentSegmentIndex, isPlaying])

  // Volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Play/pause
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      if (audioRef.current.src) audioRef.current.play().catch(() => {})
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  return null
}
