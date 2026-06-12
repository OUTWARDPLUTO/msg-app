import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MSG from './App.jsx'
import './i18n.js'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MSG />
  </StrictMode>
)
