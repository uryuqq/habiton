import { createContext, useContext, useEffect, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createDemoData } from '../data/demo'
import { addDays, dateKey } from '../utils/dates'

const AppContext = createContext(null)
const initialData = createDemoData()
export function AppProvider({ children }) {
  const [data, setData] = useLocalStorage('habiton-demo-v2', initialData)
  const [session, setSession] = useLocalStorage('habiton-demo-session', null)
  const [settings, setSettings] = useLocalStorage('habiton-settings-v2', {
    theme: 'light',
    timezone: 'Europe/Moscow',
    reducedMotion: false,
  })
  const [online, setOnline] = useState(navigator.onLine)
  const [clock, setClock] = useState(Date.now())
  const [toast, setToast] = useState('')
  const today = dateKey(new Date(clock), settings.timezone)
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const theme =
        settings.theme === 'system' ? (query.matches ? 'dark' : 'light') : settings.theme
      document.documentElement.dataset.theme = theme
      document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full'
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#121B16' : '#F7F8F2')
    }
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [settings])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  function toggleLog(habitId) {
    if (!online) {
      setToast('Без сети доступен просмотр. Для отметки восстановите подключение.')
      return
    }
    setData((current) => {
      const exists = current.logs.some((log) => log.habitId === habitId && log.date === today)
      return {
        ...current,
        logs: exists
          ? current.logs.filter((log) => !(log.habitId === habitId && log.date === today))
          : [...current.logs, { habitId, date: today }],
      }
    })
  }
  function saveHabit(draft, id) {
    const habitId = id || crypto.randomUUID()
    setData((current) => {
      const previous = current.habits.find((habit) => habit.id === id)
      const schedule = { from: today, to: null, days: draft.days, time: draft.time }
      const schedules = previous
        ? [
            ...previous.schedules
              .filter((item) => item.from < today)
              .map((item) => ({ ...item, to: item.to || addDays(today, -1) })),
            schedule,
          ]
        : [schedule]
      const habit = {
        ...previous,
        ...draft,
        id: habitId,
        createdOn: previous?.createdOn || today,
        archivedOn: null,
        schedules,
      }
      return {
        ...current,
        habits: previous
          ? current.habits.map((item) => (item.id === id ? habit : item))
          : [...current.habits, habit],
      }
    })
    setToast(id ? 'Привычка изменена' : 'Привычка добавлена')
    return habitId
  }
  function archiveHabit(id, restore = false) {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== id) return habit
        const last = habit.schedules.at(-1)
        // Закрываем период при архивировании; восстановление открывает новый.
        const schedules = restore
          ? [...habit.schedules, { from: today, to: null, days: last.days, time: last.time }]
          : habit.schedules.map((item) => (item.to ? item : { ...item, to: addDays(today, -1) }))
        return { ...habit, schedules, archivedOn: restore ? null : today }
      }),
    }))
    setToast(restore ? 'Привычка восстановлена' : 'Привычка в архиве. История сохранена.')
  }
  function savePlan(items) {
    const selected = items.filter((item) => item.selected)
    setData((current) => ({
      ...current,
      habits: [
        ...current.habits,
        ...selected.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          createdOn: today,
          archivedOn: null,
          schedules: [{ from: today, to: null, days: item.days, time: item.time }],
        })),
      ],
    }))
    setToast(`В план добавлено: ${selected.length}`)
  }
  function recordAdmin(action, update) {
    if (!online) {
      setToast('Для изменения данных восстановите подключение.')
      return
    }
    setData((current) => ({
      ...update(current),
      audit: [
        { id: crypto.randomUUID(), date: new Date().toISOString(), action, result: 'Успешно' },
        ...current.audit,
      ],
    }))
    setToast('Изменение сохранено')
  }
  function startDemo(role = 'user', email) {
    setSession({ role })
    if (email) setData((current) => ({ ...current, profile: { ...current.profile, email } }))
  }
  function resetDemo() {
    localStorage.removeItem('habiton-plan-preview')
    localStorage.removeItem('habiton-plan-preview-saved')
    setData(createDemoData())
    setToast('Демонстрационные данные восстановлены')
  }
  return (
    <AppContext.Provider
      value={{
        data,
        setData,
        session,
        setSession,
        settings,
        setSettings,
        online,
        today,
        toast,
        setToast,
        toggleLog,
        saveHabit,
        archiveHabit,
        savePlan,
        recordAdmin,
        startDemo,
        resetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
export function useApp() {
  return useContext(AppContext)
}
