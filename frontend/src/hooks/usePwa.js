import { useEffect, useState } from 'react'

export function usePwa() {
  const [ready, setReady] = useState(false)
  const [waiting, setWaiting] = useState(null)
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
    let mounted = true
    function readyNow() {
      if (mounted) setReady(true)
    }
    navigator.serviceWorker.ready.then(readyNow)
    navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL).then((registration) => {
      if (!registration || !mounted) return
      if (registration.waiting) setWaiting(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller && mounted)
            setWaiting(worker)
        })
      })
    })
    window.addEventListener('habiton-offline-ready', readyNow)
    return () => {
      mounted = false
      window.removeEventListener('habiton-offline-ready', readyNow)
    }
  }, [])
  function update() {
    if (!waiting) return
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    })
    waiting.postMessage('SKIP_WAITING')
  }
  return { ready, waiting, update }
}
