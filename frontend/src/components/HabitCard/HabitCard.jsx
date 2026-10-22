import { asset } from '../../utils/assets'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Checkbox } from '../UI/UI'
import s from './HabitCard.module.css'
const symbols = {
  book: '/design/8a848984-a06a-4358-bef3-2252d467ad4a.svg',
  walk: '/design/b2f29eb0-a94e-4ba5-bebe-d474d3edcf5c.svg',
  moon: '/design/0c4032f1-c328-412b-9b0a-11a3614dfeba.svg',
  water: '/design/88a6e54b-f527-4662-9636-50631f6f5e02.svg',
}
export function HabitCard({ habit, done = false, onToggle, disabled = false }) {
  return (
    <article className={`${s.card} ${done ? s.done : ''}`}>
      <span className={s.symbol}>
        <img src={asset(symbols[habit.symbol] || symbols.book)} width="22" height="22" alt="" />
      </span>
      <Link className={s.name} to={`/habits/${habit.id}`}>
        <strong>{habit.title}</strong>
        <small>
          {habit.note || habit.category}
          {habit.time ? ` · ${habit.time}` : ''}
        </small>
      </Link>
      {onToggle ? (
        <Checkbox
          label={`${done ? 'Отменить выполнение' : 'Отметить выполнение'}: ${habit.title}`}
          checked={done}
          onChange={onToggle}
          disabled={disabled}
        />
      ) : (
        <ChevronRight size={20} />
      )}
    </article>
  )
}
