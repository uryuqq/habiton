import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// Service worker включён только в собранной версии, чтобы не мешать разработке.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        {
          updateViaCache: 'none',
        },
      )
      // Проверяем обновления при запуске. Открытую форму при этом не перезагружаем.
      await registration.update()
      await navigator.serviceWorker.ready
      window.dispatchEvent(new Event('habiton-offline-ready'))
    } catch (error) {
      console.warn('Офлайн-режим пока недоступен:', error.message)
    }
  })
}
