import { useEffect, useState } from 'react'

// Читаем один раз при запуске. Повреждённое или недоступное хранилище не ломает экран.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved === null ? initialValue : JSON.parse(saved)
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* Работаем в памяти, если хранилище заполнено. */
    }
  }, [key, value])
  return [value, setValue]
}
