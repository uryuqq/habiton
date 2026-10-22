export function dateKey(date = new Date(), timezone = 'Europe/Moscow') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
export function addDays(key, amount) {
  const date = new Date(`${key}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
export function weekday(key) {
  return (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7
}
export function displayDate(key, options = { day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('ru-RU', { ...options, timeZone: 'UTC' }).format(
    new Date(`${key}T12:00:00Z`),
  )
}
// Для прошлых дат используем расписание, которое действовало тогда.
export function scheduled(habit, key) {
  if (key < habit.createdOn || (habit.archivedOn && key >= habit.archivedOn)) return false
  const schedule = habit.schedules.find((item) => key >= item.from && (!item.to || key <= item.to))
  return Boolean(schedule?.days.includes(weekday(key)))
}
export function dayStats(habits, logs, key) {
  const planned = habits.filter((habit) => scheduled(habit, key))
  const completed = planned.filter((habit) =>
    logs.some((log) => log.habitId === habit.id && log.date === key),
  )
  return { planned: planned.length, completed: completed.length }
}
export function periodStats(habits, logs, from, to) {
  let planned = 0,
    completed = 0
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const result = dayStats(habits, logs, day)
    planned += result.planned
    completed += result.completed
  }
  return { planned, completed, percent: planned ? Math.round((completed / planned) * 100) : 0 }
}
export function streak(habit, logs, today) {
  let count = 0
  for (let day = today, i = 0; i < 366; day = addDays(day, -1), i++) {
    if (!scheduled(habit, day)) continue
    if (logs.some((log) => log.habitId === habit.id && log.date === day)) count++
    else if (day !== today) break
  }
  return count
}
export const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
