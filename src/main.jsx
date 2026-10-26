import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MSG from './App.jsx'
import './i18n.js'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker immediately for full offline caching
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[MSG PWA] App ready to work offline');
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MSG />
  </StrictMode>
)

