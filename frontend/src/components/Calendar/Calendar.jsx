import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dayStats, displayDate, weekday, weekLabels } from '../../utils/dates'
import s from './Calendar.module.css'

export function Calendar({ habits, logs, today, onSelect, selected }) {
  const [month, setMonth] = useState(today.slice(0, 7))
  function shift(amount) {
    const date = new Date(`${month}-15T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() + amount)
    setMonth(date.toISOString().slice(0, 7))
  }
  const start = `${month}-01`
  const length = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate()
  return (
    <>
      <div className={s.header}>
        <button aria-label="Предыдущий месяц" onClick={() => shift(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h3>{displayDate(start, { month: 'long', year: 'numeric' })}</h3>
        <button aria-label="Следующий месяц" onClick={() => shift(1)}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className={s.grid}>
        {weekLabels.map((label) => (
          <span key={label} className={s.label}>
            {label}
          </span>
        ))}
        {Array.from({ length: weekday(start) }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, '0')}`
          const stats = dayStats(habits, logs, date)
          const future = date > today
          const status = future
            ? 'Будущий день'
            : !stats.planned
              ? 'Без плана'
              : `Выполнено ${stats.completed} из ${stats.planned}`
          const classes = [
            s.day,
            future
              ? s.future
              : stats.planned && stats.completed === stats.planned
                ? s.complete
                : stats.completed
                  ? s.partial
                  : '',
            date === selected ? s.selected : '',
          ].join(' ')
          return (
            <button
              key={date}
              className={classes}
              onClick={() => onSelect?.(date)}
              aria-label={`${displayDate(date)}, ${status}`}
              aria-pressed={date === selected}
              aria-current={date === today ? 'date' : undefined}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
      <div className={s.legend}>
        <span>
          <i className={s.complete} />
          Всё выполнено
        </span>
        <span>
          <i className={s.partial} />
          Часть
        </span>
        <span>
          <i />
          Без плана
        </span>
      </div>
    </>
  )
}
