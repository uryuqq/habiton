import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { allDays } from '../data/demo'
import { addDays, periodStats, streak, weekLabels } from '../utils/dates'
import { HabitCard } from '../components/HabitCard/HabitCard'
import { Calendar } from '../components/Calendar/Calendar'
import {
  BackHeader,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  PageTitle,
  Tabs,
} from '../components/UI/UI'
import { NotFoundPage } from './SystemPages'
import p from './Pages.module.css'

export function HabitsPage() {
  const { data } = useApp()
  const [tab, setTab] = useState('active')
  const items = data.habits.filter((habit) => Boolean(habit.archivedOn) === (tab === 'archive'))
  return (
    <>
      <Tabs
        label="Список привычек"
        items={[
          { value: 'active', label: 'Активные' },
          { value: 'archive', label: 'Архив' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className={p.stack}>
        {items.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </div>
      {!items.length && (
        <EmptyState title={tab === 'archive' ? 'В архиве пока пусто' : 'Начните с одной привычки'}>
          Здесь будут ваши привычки. История архивных привычек сохраняется.
        </EmptyState>
      )}
      <div className={p.actions}>
        <Button to="/habits/new">
          <Plus size={22} />
          Новая привычка
        </Button>
      </div>
    </>
  )
}
export function HabitEditorPage() {
  const { id } = useParams()
  const { data, saveHabit, online } = useApp()
  const navigate = useNavigate()
  const habit = data.habits.find((item) => item.id === id)
  const [draft, setDraft] = useState(() => ({
    title: habit?.title || '',
    note: habit?.note || '',
    category: habit?.category || 'Самочувствие',
    symbol: habit?.symbol || 'book',
    time: habit?.time || '',
    days: habit?.schedules.at(-1).days || allDays,
  }))
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }
  function submit(event) {
    event.preventDefault()
    const next = {}
    if (!draft.title.trim()) next.title = 'Напишите небольшое действие'
    if (!draft.days.length) next.days = 'Выберите хотя бы один день'
    setErrors(next)
    if (Object.keys(next).length || !online) return
    const savedId = saveHabit({ ...draft, title: draft.title.trim(), note: draft.note.trim() }, id)
    setDirty(false)
    navigate(`/habits/${savedId}`)
  }
  if (id && !habit) return <NotFoundPage />
  return (
    <>
      <BackHeader
        title={id ? 'Редактировать привычку' : 'Новая привычка'}
        to={id ? `/habits/${id}` : '/today'}
      />
      <form className={p.page} onSubmit={submit} noValidate>
        <p className={p.note}>Одно небольшое действие, которое удобно повторять.</p>
        <Field
          label="Что будете делать?"
          error={errors.title}
          hint="Например: читать 10 минут · до 80 символов"
        >
          <input
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
            maxLength={80}
            required
            aria-invalid={Boolean(errors.title)}
          />
        </Field>
        <Field label="Короткая подсказка · необязательно">
          <textarea
            value={draft.note}
            onChange={(event) => update('note', event.target.value)}
            maxLength={160}
            placeholder="Когда и как вам будет легче начать"
          />
        </Field>
        <Field label="Направление">
          <select
            value={draft.category}
            onChange={(event) => update('category', event.target.value)}
          >
            {['Самочувствие', 'Обучение', 'Движение', 'Отдых'].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>
        <div className={p.row}>
          <h3>Какие дни?</h3>
          <button type="button" className={p.textButton} onClick={() => update('days', allDays)}>
            Каждый день
          </button>
        </div>
        <div className={p.days} role="group" aria-label="Дни недели">
          {weekLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={draft.days.includes(index)}
              onClick={() =>
                update(
                  'days',
                  draft.days.includes(index)
                    ? draft.days.filter((day) => day !== index)
                    : [...draft.days, index],
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
        {errors.days && (
          <p role="alert" className={p.error}>
            {errors.days}
          </p>
        )}
        <Field label="Время · необязательно">
          <input
            type="time"
            value={draft.time}
            onChange={(event) => update('time', event.target.value)}
          />
        </Field>
        {!online && <p className={p.note}>Сохранение доступно после восстановления сети.</p>}
        <div className={p.actions}>
          <Button type="submit" disabled={!online}>
            {id ? 'Сохранить изменения' : 'Добавить привычку'}
          </Button>
          <Button
            variant="quiet"
            onClick={() => (dirty ? setConfirmLeave(true) : navigate('/habits'))}
          >
            Отменить
          </Button>
        </div>
      </form>
      {confirmLeave && (
        <ConfirmDialog
          title="Отменить изменения?"
          confirm="Не сохранять"
          onClose={() => setConfirmLeave(false)}
          onConfirm={() => navigate('/habits')}
        >
          Несохранённый текст формы будет потерян.
        </ConfirmDialog>
      )}
    </>
  )
}
export function HabitDetailPage() {
  const { id } = useParams()
  const { data, today, archiveHabit, online } = useApp()
  const [confirm, setConfirm] = useState(false)
  const habit = data.habits.find((item) => item.id === id)
  if (!habit) return <NotFoundPage />
  const stats = periodStats([habit], data.logs, addDays(today, -29), today)
  return (
    <>
      <BackHeader title="О привычке" to="/habits" />
      <div className={p.page}>
        <PageTitle
          title={habit.title}
          subtitle={`${habit.schedules
            .at(-1)
            .days.map((day) => weekLabels[day])
            .join(', ')}${habit.time ? ' · ' + habit.time : ''}`}
          badge={habit.archivedOn ? 'В архиве' : habit.category}
        />
        {habit.note && <p>{habit.note}</p>}
        <div className={p.stats}>
          <Card>
            <p className={p.statLabel}>Текущая серия</p>
            <div className={p.number}>{streak(habit, data.logs, today)} дн.</div>
            <p className={p.muted}>Запланированных подряд</p>
          </Card>
          <Card>
            <p className={p.statLabel}>Последние 30 дней</p>
            <div className={p.number}>
              {stats.completed} / {stats.planned}
            </div>
            <p className={p.muted}>Выполнено по плану</p>
          </Card>
        </div>
        <Card>
          <Calendar habits={[habit]} logs={data.logs} today={today} />
        </Card>
        <p className={p.note}>
          Прошлые дни доступны для просмотра. Изменение расписания не переписывает историю.
        </p>
        <div className={p.actions}>
          {!habit.archivedOn && <Button to={`/habits/${id}/edit`}>Редактировать</Button>}
          <Button variant="secondary" disabled={!online} onClick={() => setConfirm(true)}>
            {habit.archivedOn ? 'Восстановить' : 'Архивировать'}
          </Button>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          title={habit.archivedOn ? 'Вернуть привычку?' : 'Отложить привычку?'}
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            archiveHabit(id, Boolean(habit.archivedOn))
            setConfirm(false)
          }}
        >
          {habit.archivedOn
            ? 'Привычка снова появится в вашем списке.'
            : 'Она исчезнет из плана, но история останется.'}
        </ConfirmDialog>
      )}
    </>
  )
}
