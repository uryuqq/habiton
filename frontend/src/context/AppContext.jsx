import { createContext, useContext, useEffect, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createDemoData } from '../data/demo'
import { addDays, dateKey } from '../utils/dates'
import { api, serverMode } from '../utils/api'

const AppContext = createContext(null)
const initialData = createDemoData()
const emptyData = {
  profile: { name: '', email: '', role: 'guest' },
  habits: [],
  logs: [],
  dialogues: [],
  users: [],
  templates: [],
  audit: [],
  aiEvents: [],
  instruction: '',
}
export function AppProvider({ children }) {
  const [demoData, setDemoData] = useLocalStorage('habiton-demo-v2', initialData)
  const [session, setSession] = useLocalStorage('habiton-demo-session', null)
  const [settings, setSettings] = useLocalStorage('habiton-settings-v2', {
    theme: 'light',
    timezone: 'Europe/Moscow',
    reducedMotion: false,
  })
  const [online, setOnline] = useState(navigator.onLine)
  const [clock, setClock] = useState(Date.now())
  const [toast, setToast] = useState('')
  const [serverData, setServerData] = useState(null)
  const [ready, setReady] = useState(!serverMode)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const data = serverMode ? serverData || emptyData : demoData
  const setData = serverMode ? setServerData : setDemoData

  async function run(action, body) {
    setBusy(true)
    try {
      const result = await api(action, { ...body, timezone: settings.timezone })
      setServerData(result.data)
      return result
    } catch (error) {
      if (error.dialogues) {
        setServerData((current) => ({ ...current, dialogues: error.dialogues }))
      }
      if (error.status === 401 && action !== 'login') setServerData(null)
      setToast(error.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!serverMode || !online) return
    let active = true
    api()
      .then(({ data }) => {
        if (active) {
          setServerData(data)
          setLoadError('')
        }
      })
      .catch(() => {
        if (active) setLoadError('Не удалось подключиться к серверу Хабитона.')
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [online, retryCount])
  const today = dateKey(new Date(clock), settings.timezone)
  useEffect(() => {
    // Добавляем роль в прежние сохранения, не сбрасывая привычки и отметки на телефоне.
    if (serverMode) return
    const isAlex = data.profile.name === 'Алексей' || data.profile.email === 'alex@example.com'
    if (data.profile.role && (!isAlex || data.profile.role === 'admin')) return
    setData((current) => ({
      ...current,
      profile: { ...current.profile, role: isAlex ? 'admin' : current.profile.role || 'user' },
      users: current.users.map((user) => ({
        ...user,
        role: user.id === 'u1' ? 'admin' : user.role || 'user',
      })),
    }))
  }, [data.profile.role, data.profile.name, data.profile.email, setData])
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
    if (serverMode) {
      if (!busy)
        return run('mark', {
          id: habitId,
          done: !data.logs.some((log) => log.habitId === habitId && log.date === today),
        })
      return
    }
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
  async function saveHabit(draft, id) {
    if (serverMode) {
      const result = await run('habit', { ...draft, id })
      if (result) setToast(id ? 'Привычка изменена' : 'Привычка добавлена')
      return result?.id
    }
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
  async function archiveHabit(id, restore = false) {
    if (serverMode) {
      const result = await run('archive', { id, restore })
      if (result) setToast(restore ? 'Привычка восстановлена' : 'Привычка в архиве')
      return
    }
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
    setSession({ role: data.profile.role || role })
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
        serverMode,
        authenticated: Boolean(serverData),
        ready,
        busy,
        loadError,
        retryConnection: () => setRetryCount((count) => count + 1),
        run,
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
