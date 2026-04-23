import { useEffect, useState } from 'react'

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100)
    const t2 = setTimeout(() => setPhase('exit'), 1800)
    const t3 = setTimeout(onFinish, 2300)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: '#000000',
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.5)' : 'scale(1)',
          transition: 'all 1s ease-out'
        }}
      />

      {/* Robot icon (CSS pixel art) */}
      <div
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(20px) scale(0.8)' : 'translateY(0) scale(1)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: '0.1s'
        }}
      >
        <svg width="80" height="80" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
          {/* Head */}
          <rect x="9" y="8" width="14" height="14" rx="2" fill="#0a0c1e" stroke="#00e5ff" strokeWidth="0.5" opacity="0.8"/>
          {/* Eyes */}
          <rect x="12" y="12" width="3" height="2" fill="#00e5ff">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
          </rect>
          <rect x="17" y="12" width="3" height="2" fill="#00e5ff">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
          </rect>
          {/* Mouth */}
          <rect x="13" y="16" width="6" height="1" fill="#0099aa"/>
          {/* Antenna */}
          <rect x="15" y="5" width="2" height="3" fill="#8a94a8"/>
          <rect x="15" y="4" width="2" height="1" fill="#00e5ff">
            <animate attributeName="fill" values="#00e5ff;#7c4dff;#00e5ff" dur="1.5s" repeatCount="indefinite"/>
          </rect>
          {/* Headband */}
          <path d="M8,7 L8,10" stroke="#8a94a8" strokeWidth="1" fill="none"/>
          <path d="M24,7 L24,10" stroke="#8a94a8" strokeWidth="1" fill="none"/>
          <path d="M8,7 Q16,2 24,7" stroke="#c0c8d8" strokeWidth="1" fill="none"/>
          {/* Left ear cup */}
          <rect x="5" y="10" width="3" height="6" rx="1" fill="#2979ff"/>
          {/* Right ear cup */}
          <rect x="24" y="10" width="3" height="6" rx="1" fill="#2979ff"/>
          {/* Body */}
          <rect x="11" y="22" width="10" height="4" rx="1" fill="#0a0c1e" stroke="#1a1e3a" strokeWidth="0.3"/>
          <rect x="13" y="24" width="2" height="1" fill="#00e5ff" opacity="0.7"/>
          <rect x="17" y="24" width="2" height="1" fill="#7c4dff" opacity="0.7"/>
        </svg>
      </div>

      {/* Title */}
      <div
        className="mt-6 flex flex-col items-center gap-2"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(15px)' : 'translateY(0)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: '0.3s'
        }}
      >
        <span
          className="text-xl font-bold tracking-[0.3em] uppercase"
          style={{
            color: '#00e5ff',
            textShadow: '0 0 12px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.15)'
          }}
        >
          SoundWave
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#464d5e' }}>
          AI-Powered Radio Station
        </span>
      </div>

      {/* Loading bar */}
      <div
        className="mt-8 overflow-hidden"
        style={{
          width: 120,
          height: 2,
          borderRadius: 1,
          background: 'rgba(255,255,255,0.05)',
          opacity: phase === 'enter' ? 0 : 1,
          transition: 'opacity 0.4s',
          transitionDelay: '0.5s'
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 1,
            background: 'linear-gradient(90deg, #00e5ff, #2979ff, #7c4dff)',
            width: phase === 'enter' ? '0%' : '100%',
            transition: 'width 1.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.5s',
            boxShadow: '0 0 8px rgba(0,229,255,0.4)'
          }}
        />
      </div>
    </div>
  )
}
