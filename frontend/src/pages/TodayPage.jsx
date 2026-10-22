import { useState } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDays, dayStats, displayDate, scheduled, weekday, weekLabels } from '../utils/dates'
import { HabitCard } from '../components/HabitCard/HabitCard'
import { Badge, Button, EmptyState, Plant, SectionHeading } from '../components/UI/UI'
import s from './TodayPage.module.css'
import p from './Pages.module.css'

export function TodayPage({ empty = false, rest = false }) {
  const { data, today, toggleLog, online } = useApp()
  const [selected, setSelected] = useState(today)
  const start = addDays(today, -weekday(today))
  const dates = weekLabels.map((label, index) => ({ label, date: addDays(start, index) }))
  const habits = data.habits.filter((habit) => scheduled(habit, selected))
  const done = habits.filter((habit) =>
    data.logs.some((log) => log.habitId === habit.id && log.date === selected),
  )
  const remaining = habits.filter((habit) => !done.includes(habit))
  if (empty || (!data.habits.length && !rest))
    return (
      <EmptyState
        title="Ваш сад начинается здесь"
        image={<Plant />}
        action={
          <>
            <Button to="/habits/new">Добавить привычку</Button>
            <Button variant="secondary" to="/onboarding">
              Помочь с планом
            </Button>
          </>
        }
      >
        Добавьте одну привычку или составьте небольшой план с помощником.
      </EmptyState>
    )
  if (rest)
    return (
      <EmptyState
        title="Сегодня день без плана"
        image={<Plant />}
        action={<Button to="/habits">Все привычки</Button>}
      >
        На этот день привычки не назначены. Накопленный прогресс остаётся с вами.
      </EmptyState>
    )
  return (
    <>
      <div className={s.week} aria-label="Текущая неделя">
        {dates.map(({ label, date }) => (
          <button
            key={date}
            className={date === selected ? s.active : ''}
            onClick={() => setSelected(date)}
            aria-pressed={date === selected}
            aria-label={displayDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
          >
            <span>{label}</span>
            <strong>{Number(date.slice(-2))}</strong>
            <i style={{ opacity: dayStats(data.habits, data.logs, date).completed ? 1 : 0 }} />
          </button>
        ))}
      </div>
      <div className={p.row}>
        <span className={s.progressCopy}>
          {selected !== today
            ? displayDate(selected)
            : done.length === habits.length && habits.length
              ? 'На сегодня всё выполнено'
              : 'Каждый небольшой шаг считается'}
        </span>
        <strong className={s.progressCopy}>
          {done.length} из {habits.length}
        </strong>
      </div>
      <div className={p.progress}>
        <span style={{ width: `${habits.length ? (done.length / habits.length) * 100 : 0}%` }} />
      </div>
      <div className={s.columns}>
        <div className={s.habits}>
          <SectionHeading to="/habits" link="Все привычки">
            Мой день
          </SectionHeading>
          {selected !== today && (
            <p className={p.note}>
              {selected > today
                ? 'Будущий день. Отметки появятся, когда он наступит.'
                : 'История доступна для просмотра. Отмечать можно за сегодня.'}
            </p>
          )}
          <div className={p.stack}>
            {remaining.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={selected === today ? () => toggleLog(habit.id) : undefined}
                disabled={!online}
              />
            ))}
          </div>
          {done.length > 0 && (
            <>
              <p className={s.eyebrow}>Выполнено</p>
              <div className={p.stack}>
                {done.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    done
                    onToggle={selected === today ? () => toggleLog(habit.id) : undefined}
                    disabled={!online}
                  />
                ))}
              </div>
            </>
          )}
          {!habits.length && (
            <EmptyState title="День без плана">
              Здесь появятся привычки, запланированные на выбранную дату.
            </EmptyState>
          )}
          <Button variant="secondary" to="/habits/new" className={s.add}>
            <Plus size={22} />
            Добавить привычку
          </Button>
        </div>
        <Link to="/garden" className={s.garden}>
          <div>
            <Badge>Молодое растение</Badge>
            <h2>Понемногу растём</h2>
            <p>
              {data.logs.length * 10} опыта · до нового этапа
              <br />
              {150 - ((data.logs.length * 10) % 150)} опыта
            </p>
          </div>
          <Plant small />
        </Link>
      </div>
    </>
  )
}
