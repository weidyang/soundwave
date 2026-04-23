import { useEffect, useRef } from 'react'
import { useRadioStore } from '../../stores/radio-store'

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPlaying = useRadioStore(s => s.isPlaying)
  const animRef = useRef<number>(0)
  const barsRef = useRef<Float32Array | null>(null)
  const peaksRef = useRef<Float32Array | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const barCount = 64
    if (!barsRef.current || barsRef.current.length !== barCount) {
      barsRef.current = new Float32Array(barCount)
      peaksRef.current = new Float32Array(barCount)
    }
    const bars = barsRef.current
    const peaks = peaksRef.current!

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const mainH = h * 0.72
      ctx.clearRect(0, 0, w, h)

      const gap = 2
      const barWidth = (w - (barCount - 1) * gap) / barCount

      for (let i = 0; i < barCount; i++) {
        if (isPlaying) {
          const wave = Math.sin(Date.now() * 0.0018 + i * 0.22) * 0.15
          const center = 1 - Math.abs(i - barCount / 2) / (barCount / 2)
          const target = (Math.random() * 0.4 + 0.12 + wave) * (0.4 + center * 0.6)
          bars[i] += (target - bars[i]) * 0.1
        } else {
          bars[i] *= 0.91
        }

        if (bars[i] > peaks[i]) peaks[i] = bars[i]
        else peaks[i] *= 0.982

        const barH = Math.max(1.5, bars[i] * mainH * 0.92)
        const x = i * (barWidth + gap)
        const y = mainH - barH

        // Main gradient: cyan top → blue → purple bottom
        const grad = ctx.createLinearGradient(x, y, x, mainH)
        const t = bars[i] / 0.5
        grad.addColorStop(0, `rgba(0, 229, 255, ${0.7 + t * 0.3})`)
        grad.addColorStop(0.4, `rgba(41, 121, 255, ${0.5 + t * 0.3})`)
        grad.addColorStop(1, `rgba(124, 77, 255, ${0.15 + t * 0.15})`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barH, 1.5)
        ctx.fill()

        // Bright glow on tall bars
        if (bars[i] > 0.15) {
          ctx.shadowColor = 'rgba(0, 229, 255, 0.3)'
          ctx.shadowBlur = 8
          ctx.fillStyle = `rgba(0, 229, 255, ${bars[i] * 0.05})`
          ctx.fillRect(x - 1, y - 1, barWidth + 2, barH + 2)
          ctx.shadowBlur = 0
        }

        // Peak hold line
        if (peaks[i] > 0.03) {
          const peakY = mainH - peaks[i] * mainH * 0.92
          ctx.fillStyle = `rgba(0, 229, 255, ${0.5 + peaks[i] * 0.5})`
          ctx.fillRect(x, peakY - 1, barWidth, 2)
        }

        // Reflection
        const reflH = barH * 0.3
        const reflGrad = ctx.createLinearGradient(x, mainH + 3, x, mainH + 3 + reflH)
        reflGrad.addColorStop(0, `rgba(0, 229, 255, ${0.06 * t})`)
        reflGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = reflGrad
        ctx.fillRect(x, mainH + 3, barWidth, reflH)
      }

      // Horizon glow line
      const lineGrad = ctx.createLinearGradient(0, mainH, w, mainH)
      lineGrad.addColorStop(0, 'transparent')
      lineGrad.addColorStop(0.3, 'rgba(0, 229, 255, 0.08)')
      lineGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.12)')
      lineGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.08)')
      lineGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = lineGrad
      ctx.fillRect(0, mainH, w, 1.5)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying])

  return <canvas ref={canvasRef} className="w-full h-[80px]" />
}
