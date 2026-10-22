import { useState } from 'react'
import { Award, Leaf, LockKeyhole } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  addDays,
  dayStats,
  displayDate,
  periodStats,
  scheduled,
  weekday,
  weekLabels,
} from '../utils/dates'
import { Calendar } from '../components/Calendar/Calendar'
import { HabitCard } from '../components/HabitCard/HabitCard'
import {
  BackHeader,
  Badge,
  Button,
  Card,
  PageTitle,
  Plant,
  SectionHeading,
  Tabs,
} from '../components/UI/UI'
import p from './Pages.module.css'

export function ProgressPage() {
  const { data, today } = useApp()
  const [period, setPeriod] = useState('week')
  const from = period === 'week' ? addDays(today, -weekday(today)) : today.slice(0, 7) + '-01'
  const stats = periodStats(data.habits, data.logs, from, today)
  const weekStart = addDays(today, -weekday(today))
  return (
    <>
      <Tabs
        label="Период статистики"
        items={[
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      <Card>
        <p className={p.muted}>
          {displayDate(from)} — {displayDate(today)}
        </p>
        <div className={p.number}>
          {stats.completed} из {stats.planned}
        </div>
        <p>Запланированных действий выполнено</p>
        <div className={p.progress}>
          <span style={{ width: `${stats.percent}%` }} />
        </div>
        <Badge>{stats.percent}% выполнения</Badge>
      </Card>
      <SectionHeading to="/garden" link="Мой сад">
        {period === 'week' ? 'Эта неделя' : 'История месяца'}
      </SectionHeading>
      <Card>
        {period === 'week' ? (
          <>
            <div className={p.chart} role="img" aria-label="Выполнение привычек за неделю">
              {weekLabels.map((label, index) => {
                const date = addDays(weekStart, index)
                const result = dayStats(data.habits, data.logs, date)
                const percent = result.planned ? (result.completed / result.planned) * 100 : 0
                return (
                  <div
                    key={label}
                    className={p.chartColumn}
                    title={`${label}: ${date > today ? 'ещё не наступил' : `${result.completed} из ${result.planned}`}`}
                  >
                    <small>{date > today ? '—' : result.completed}</small>
                    <div
                      className={p.bar}
                      style={{
                        height: `${Math.max(2, percent)}%`,
                        opacity: date > today ? 0.2 : 1,
                      }}
                    />
                    <small>{label}</small>
                  </div>
                )
              })}
            </div>
            <p className={p.note}>
              Будущие дни не считаются пропущенными. Значения над столбцами — число выполнений.
            </p>
          </>
        ) : (
          <Calendar habits={data.habits} logs={data.logs} today={today} />
        )}
      </Card>
      <SectionHeading to="/calendar" link="Календарь">
        История
      </SectionHeading>
      <Card>
        <h3>Можно продолжить сегодня</h3>
        <p className={p.muted}>Один пропущенный день не отменяет ваши прошлые шаги.</p>
      </Card>
    </>
  )
}
export function CalendarPage() {
  const { data, today } = useApp()
  const [selected, setSelected] = useState(today)
  const stats = dayStats(data.habits, data.logs, selected)
  return (
    <>
      <BackHeader title="Календарь" to="/progress" />
      <div className={p.page}>
        <Card>
          <Calendar
            habits={data.habits}
            logs={data.logs}
            today={today}
            selected={selected}
            onSelect={setSelected}
          />
        </Card>
        <SectionHeading>{displayDate(selected)}</SectionHeading>
        <p className={p.note}>
          {selected > today
            ? 'Будущий день: отметок пока нет.'
            : stats.planned
              ? `Выполнено ${stats.completed} из ${stats.planned} привычек`
              : 'День без плана'}
        </p>
        <div className={p.stack}>
          {data.habits
            .filter((habit) => scheduled(habit, selected))
            .map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                done={data.logs.some((log) => log.habitId === habit.id && log.date === selected)}
              />
            ))}
        </div>
        <p className={p.note}>
          Отметки доступны на экране «Сегодня». История здесь показана для просмотра.
        </p>
      </div>
    </>
  )
}
export function GardenPage() {
  const { data } = useApp()
  const xp = data.logs.length * 10
  const next = Math.floor(xp / 150 + 1) * 150
  return (
    <>
      <div className={p.garden}>
        <Badge>{xp < 150 ? 'Первый росток' : 'Молодое растение'}</Badge>
        <Plant />
        <h2>Всё растёт понемногу</h2>
        <p>
          Ваши небольшие действия
          <br />
          уже стали частью этого сада.
        </p>
      </div>
      <div className={p.actions}>
        <Card>
          <div className={p.row}>
            <h3>{xp} опыта</h3>
            <span className={p.muted}>Следующий этап: {next}</span>
          </div>
          <div className={p.progress}>
            <span style={{ width: `${((xp % 150) / 150) * 100}%` }} />
          </div>
          <p className={p.muted}>Ещё {next - xp} опыта до следующего этапа.</p>
        </Card>
      </div>
      <SectionHeading>Как растёт сад</SectionHeading>
      <p>
        Каждая выполненная привычка даёт 10 опыта. Пропуск не уничтожает растение. Отмена ошибочной
        отметки возвращает опыт.
      </p>
      <div className={p.actions}>
        <Button to="/achievements">Мои достижения</Button>
      </div>
    </>
  )
}
export function AchievementsPage() {
  const { data } = useApp()
  const count = data.logs.length
  const milestones = [
    { count: 1, title: 'Первый шаг', text: 'Первая выполненная привычка', icon: Award },
    { count: 7, title: 'Неделя маленьких шагов', text: '7 подтверждённых отметок', icon: Leaf },
    { count: 30, title: 'Уверенный ритм', text: '30 подтверждённых отметок', icon: Award },
  ]
  return (
    <>
      <BackHeader title="Достижения" to="/garden" />
      <div className={p.page}>
        <PageTitle title="Каждый шаг важен" subtitle="Небольшие вехи вашего пути." />
        {milestones.map((item) => {
          const unlocked = count >= item.count
          const Icon = unlocked ? item.icon : LockKeyhole
          return (
            <div key={item.title} className={`${p.milestone} ${unlocked ? '' : p.locked}`}>
              <span className={p.icon}>
                <Icon size={24} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.text} · {unlocked ? 'Получено' : `ещё ${item.count - count}`}
                </p>
              </div>
            </div>
          )
        })}
        <p className={p.note}>Достижения появляются автоматически по сохранённым демоотметкам.</p>
      </div>
    </>
  )
}
