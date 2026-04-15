import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initAnalytics } from './lib/analytics'

// 生產環境初始化追蹤
if (!import.meta.env.DEV) {
  initAnalytics()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
