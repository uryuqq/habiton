import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, BookOpen, Footprints, Leaf, Moon, Send } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { makePlan } from '../data/demo'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  BackHeader,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Modal,
  PageTitle,
} from '../components/UI/UI'
import { weekLabels } from '../utils/dates'
import p from './Pages.module.css'
import s from './CoachPages.module.css'

export function OnboardingPage() {
  const [goal, setGoal] = useState('Больше читать')
  const [custom, setCustom] = useState('')
  const [minutes, setMinutes] = useState(10)
  const { setData } = useApp()
  const navigate = useNavigate()
  function start() {
    const title = goal === 'Своя цель' ? custom.trim() : goal
    if (!title) return
    const dialogue = {
      id: crypto.randomUUID(),
      title,
      minutes,
      messages: [],
      plan: [],
      saved: false,
      createdAt: new Date().toISOString(),
    }
    setData((current) => ({ ...current, dialogues: [dialogue, ...current.dialogues] }))
    navigate(`/coach?dialogue=${dialogue.id}`)
  }
  return (
    <>
      <BackHeader title="Начало вашего пути" />
      <div className={p.page}>
        <PageTitle
          badge="Небольшой план под вас"
          title="С чего начнём?"
          subtitle="Выберите то, чему хочется уделять больше внимания."
        />
        <div className={s.choices}>
          {[
            ['Больше читать', 'Время для интересного', BookOpen],
            ['Больше двигаться', 'Небольшие прогулки', Footprints],
            ['Лучше отдыхать', 'Спокойнее к вечеру', Moon],
            ['Своя цель', 'То, что важно вам', Leaf],
          ].map(([title, text, Icon]) => (
            <button
              key={title}
              aria-pressed={goal === title}
              className={goal === title ? s.chosen : ''}
              onClick={() => setGoal(title)}
            >
              <Icon size={22} />
              <strong>{title}</strong>
              <small>{text}</small>
            </button>
          ))}
        </div>
        {goal === 'Своя цель' && (
          <Field label="Ваша цель">
            <input
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              maxLength={120}
            />
          </Field>
        )}
        <h3>Сколько времени готовы выделять?</h3>
        <div className={s.duration}>
          {[5, 10, 15].map((value) => (
            <button key={value} aria-pressed={minutes === value} onClick={() => setMinutes(value)}>
              {value} мин
            </button>
          ))}
        </div>
        <p className={p.muted}>Начнём с посильного. План можно изменить.</p>
        <div className={p.actions}>
          <Button onClick={start} disabled={goal === 'Своя цель' && !custom.trim()}>
            Составить план <ArrowRight size={20} />
          </Button>
          <Button variant="secondary" to="/habits/new">
            Создать привычку вручную
          </Button>
        </div>
      </div>
    </>
  )
}
export function CoachPage({ error = false }) {
  const { data, setData, online } = useApp()
  const [params, setParams] = useSearchParams()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const timer = useRef(null)
  const currentId = params.get('dialogue')
  const dialogue = data.dialogues.find((item) => item.id === currentId) || data.dialogues[0]
  const messages = dialogue?.messages || []
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length, loading])
  function send(text) {
    if (!text.trim() || loading || !online) return
    const id = dialogue?.id || crypto.randomUUID()
    const title = dialogue?.title || text.trim().slice(0, 80)
    const user = { id: crypto.randomUUID(), role: 'user', text: text.trim() }
    setData((current) => {
      const found = current.dialogues.some((item) => item.id === id)
      return {
        ...current,
        dialogues: found
          ? current.dialogues.map((item) =>
              item.id === id ? { ...item, messages: [...item.messages, user] } : item,
            )
          : [
              {
                id,
                title,
                minutes: 10,
                messages: [user],
                plan: [],
                saved: false,
                createdAt: new Date().toISOString(),
              },
              ...current.dialogues,
            ],
      }
    })
    setParams({ dialogue: id })
    setMessage('')
    setLoading(true)
    timer.current = setTimeout(() => {
      setData((current) => ({
        ...current,
        dialogues: current.dialogues.map((item) => {
          if (item.id !== id) return item
          const count = item.messages.filter((entry) => entry.role === 'user').length
          const ready = count >= 2
          return {
            ...item,
            plan: ready && !item.plan.length ? makePlan(title, item.minutes) : item.plan,
            messages: [
              ...item.messages,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: ready
                  ? 'Я подготовил план из трёх привычек. Посмотрите и выберите подходящие.'
                  : 'Когда вам удобнее выделить время? Начнём с небольшого действия.',
              },
            ],
          }
        }),
      }))
      setLoading(false)
    }, 450)
  }
  return (
    <>
      <Badge>План под вашу цель</Badge>
      <div className={s.chat}>
        <div className={s.message}>
          <small>Хабитон</small>
          <p>Что вы хотите изменить? Можно начать с одной небольшой цели.</p>
        </div>
        {messages.map((item) => (
          <div key={item.id} className={`${s.message} ${item.role === 'user' ? s.user : ''}`}>
            {item.role !== 'user' && <small>Хабитон</small>}
            <p>{item.text}</p>
          </div>
        ))}
        {loading && (
          <p role="status" className={p.muted}>
            Подготовка ответа…
          </p>
        )}
        <div ref={endRef} />
      </div>
      {error ? (
        <>
          <p className={p.error} role="alert">
            Помощник пока не отвечает. Ваши ответы сохранены на этом устройстве.
          </p>
          <div className={p.actions}>
            <Button to={dialogue ? `/coach?dialogue=${dialogue.id}` : '/coach'}>Повторить</Button>
            <Button variant="secondary" to="/habits/new">
              Создать привычку вручную
            </Button>
          </div>
        </>
      ) : (
        <>
          {dialogue?.plan.length > 0 && (
            <div className={p.actions}>
              <Button to={`/plan?dialogue=${dialogue.id}`}>
                {dialogue.saved ? 'Посмотреть сохранённый план' : 'Посмотреть план'}
              </Button>
            </div>
          )}
          <div className={s.replies}>
            {['Больше читать', 'Утром, 10 минут', 'Вечером, 5 минут'].map((text) => (
              <button key={text} disabled={!online || loading} onClick={() => send(text)}>
                {text}
              </button>
            ))}
          </div>
          <form
            className={s.compose}
            onSubmit={(event) => {
              event.preventDefault()
              send(message)
            }}
          >
            <input
              aria-label="Сообщение помощнику"
              placeholder="Напишите о своей цели"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              disabled={!online || loading}
            />
            <button
              aria-label="Отправить сообщение"
              disabled={!online || loading || !message.trim()}
            >
              <Send size={22} />
            </button>
          </form>
          <div className={p.row}>
            <Link className={p.textButton} to="/history">
              История диалогов
            </Link>
          </div>
        </>
      )}
    </>
  )
}
export function PlanPage() {
  const { data, setData, savePlan, online } = useApp()
  const [params] = useSearchParams()
  const dialogue =
    data.dialogues.find((item) => item.id === params.get('dialogue')) || data.dialogues[0]
  const [preview, setPreview] = useLocalStorage(
    'habiton-plan-preview',
    makePlan('Больше читать', 10),
  )
  const [editing, setEditing] = useState(null)
  const [savedPreview, setSavedPreview] = useLocalStorage('habiton-plan-preview-saved', false)
  const navigate = useNavigate()
  const plan = dialogue?.plan.length ? dialogue.plan : preview
  const saved = dialogue?.saved || savedPreview
  function update(items) {
    if (dialogue?.plan.length)
      setData((current) => ({
        ...current,
        dialogues: current.dialogues.map((item) =>
          item.id === dialogue.id ? { ...item, plan: items } : item,
        ),
      }))
    else setPreview(items)
  }
  function save() {
    if (saved || !online) return
    savePlan(plan)
    if (dialogue)
      setData((current) => ({
        ...current,
        dialogues: current.dialogues.map((item) =>
          item.id === dialogue.id ? { ...item, saved: true } : item,
        ),
      }))
    setSavedPreview(true)
    navigate('/today')
  }
  return (
    <>
      <BackHeader title="Ваш план" to="/coach" />
      <div className={p.page}>
        <PageTitle
          badge={`Цель: ${dialogue?.title || 'больше времени для себя'}`}
          title={
            <>
              Небольшой план.
              <br />
              Ваш темп.
            </>
          }
          subtitle="Оставьте подходящие привычки. Каждую можно изменить перед сохранением."
        />
        <div className={p.stack}>
          {plan.map((item) => (
            <Card key={item.id}>
              <div className={p.checkRow}>
                <Checkbox
                  label={`Выбрать: ${item.title}`}
                  checked={item.selected}
                  disabled={saved}
                  onChange={() =>
                    update(
                      plan.map((entry) =>
                        entry.id === item.id ? { ...entry, selected: !entry.selected } : entry,
                      ),
                    )
                  }
                />
                <strong>{item.title}</strong>
              </div>
              <p className={p.planMeta}>
                {item.days.length === 7
                  ? 'Каждый день'
                  : item.days.map((day) => weekLabels[day]).join(', ')}{' '}
                · {item.time}
              </p>
              <button
                className={p.textButton}
                disabled={saved}
                onClick={() => setEditing({ ...item })}
              >
                Изменить <ArrowRight size={16} />
              </button>
            </Card>
          ))}
        </div>
        <p className={p.note}>
          {saved
            ? 'Этот план уже сохранён. Повторное добавление недоступно.'
            : `Выбрано ${plan.filter((item) => item.selected).length} из ${plan.length} привычек`}
        </p>
        <div className={p.actions}>
          <Button disabled={saved || !plan.some((item) => item.selected) || !online} onClick={save}>
            Добавить в мой день
          </Button>
        </div>
      </div>
      {editing && (
        <Modal title="Изменить предложение" onClose={() => setEditing(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!editing.title.trim() || !editing.days.length) return
              update(plan.map((item) => (item.id === editing.id ? editing : item)))
              setEditing(null)
            }}
          >
            <Field label="Название">
              <input
                required
                maxLength={80}
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>
            <Field label="Подсказка">
              <textarea
                maxLength={160}
                value={editing.note}
                onChange={(event) => setEditing({ ...editing, note: event.target.value })}
              />
            </Field>
            <div className={p.days}>
              {weekLabels.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  aria-pressed={editing.days.includes(index)}
                  onClick={() =>
                    setEditing({
                      ...editing,
                      days: editing.days.includes(index)
                        ? editing.days.filter((day) => day !== index)
                        : [...editing.days, index],
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <Field label="Время">
              <input
                type="time"
                value={editing.time}
                onChange={(event) => setEditing({ ...editing, time: event.target.value })}
              />
            </Field>
            <Button type="submit" disabled={!editing.title.trim() || !editing.days.length}>
              Сохранить предложение
            </Button>
          </form>
        </Modal>
      )}
    </>
  )
}
export function HistoryPage() {
  const { data } = useApp()
  return (
    <>
      <BackHeader title="История диалогов" to="/coach" />
      <div className={p.page}>
        <div className={p.stack}>
          {data.dialogues.map((item) => (
            <Card key={item.id}>
              <h3>{item.title}</h3>
              <p className={p.muted}>
                {new Date(item.createdAt).toLocaleDateString('ru-RU')} ·{' '}
                {item.saved ? 'План сохранён' : item.plan.length ? 'План готов' : 'Черновик'}
              </p>
              <Button variant="quiet" to={`/coach?dialogue=${item.id}`}>
                Продолжить <ArrowRight size={18} />
              </Button>
            </Card>
          ))}
        </div>
        {!data.dialogues.length && (
          <p className={p.note}>История пока пуста. Начните с одной небольшой цели.</p>
        )}
        <div className={p.actions}>
          <Button to="/onboarding">Новая цель</Button>
        </div>
      </div>
    </>
  )
}
