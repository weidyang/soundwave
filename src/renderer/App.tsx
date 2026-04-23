import { useEffect, useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { SplashScreen } from './components/layout/SplashScreen'
import { useChannelStore } from './stores/channel-store'
import { useSettingsStore } from './stores/settings-store'

export default function App() {
  const setChannels = useChannelStore(s => s.setChannels)
  const loadSettings = useSettingsStore(s => s.load)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    loadSettings()
    window.electronAPI.listChannels().then(setChannels)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <AppLayout />
    </>
  )
}
