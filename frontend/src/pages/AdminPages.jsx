import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router'
import { useApp } from '../context/AppContext'
import { allDays, aiEvents } from '../data/demo'
import { weekLabels } from '../utils/dates'
import { Badge, Button, Card, ConfirmDialog, Field, PageTitle, Tabs } from '../components/UI/UI'
import { NotFoundPage } from './SystemPages'
import p from './Pages.module.css'
import s from './AdminPages.module.css'

export function AdminLayout() {
  return (
    <div className={`${p.page} ${p.wide}`}>
      <nav className={s.tabs} aria-label="Разделы администрирования">
        {[
          ['/admin', 'Обзор'],
          ['/admin/users', 'Пользователи'],
          ['/admin/ai', 'ИИ'],
          ['/admin/templates', 'Шаблоны'],
          ['/admin/audit', 'Журнал'],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) => (isActive ? s.active : '')}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
export function AdminOverviewPage() {
  const { data } = useApp()
  return (
    <>
      <p className={p.periodTitle}>ОБЩАЯ СТАТИСТИКА</p>
      <div className={p.stats}>
        {[
          ['Пользователи', data.users.length],
          ['Активные', data.users.filter((user) => !user.blocked).length],
          ['Обращения к ИИ', aiEvents.length],
          ['Ошибки ИИ', aiEvents.filter((event) => event.status !== 'Успешно').length],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className={p.statLabel}>{label}</p>
            <div className={p.number}>{value}</div>
            <p className={p.muted}>Всего</p>
          </Card>
        ))}
      </div>
      <Card>
        <Badge>Требует внимания</Badge>
        <h3>Ошибка внешнего сервиса</h3>
        <p className={p.muted}>Посмотрите техническую причину в мониторинге.</p>
        <Button variant="quiet" to="/admin/ai">
          Открыть события
        </Button>
      </Card>
    </>
  )
}
export function AdminUsersPage() {
  const { data, recordAdmin } = useApp()
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState(null)
  const users = data.users.filter((user) =>
    user.email.toLowerCase().includes(search.trim().toLowerCase()),
  )
  function change() {
    recordAdmin(
      `${pending.blocked ? 'Разблокировка' : 'Блокировка'} ${pending.email}`,
      (current) => ({
        ...current,
        users: current.users.map((user) =>
          user.id === pending.id ? { ...user, blocked: !user.blocked } : user,
        ),
      }),
    )
    setPending(null)
  }
  return (
    <>
      <Field label="Найти по email">
        <input
          type="search"
          placeholder="user@example.com"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Учётная запись</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td data-label="Email">
                {user.email}
                <small>{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</small>
              </td>
              <td data-label="Статус">{user.blocked ? 'Заблокирован' : 'Активен'}</td>
              <td data-label="Действие">
                <button className={p.textButton} onClick={() => setPending(user)}>
                  {user.blocked ? 'Разблокировать' : 'Блокировать'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!users.length && <p className={p.note}>По этому email ничего не найдено.</p>}
      {pending && (
        <ConfirmDialog
          title={pending.blocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя?'}
          onClose={() => setPending(null)}
          onConfirm={change}
        >
          {pending.email}
        </ConfirmDialog>
      )}
    </>
  )
}
export function AdminAiPage() {
  const { data, recordAdmin } = useApp()
  const [filter, setFilter] = useState('all')
  const [instruction, setInstruction] = useState(data.instruction)
  const events =
    filter === 'errors' ? aiEvents.filter((event) => event.status !== 'Успешно') : aiEvents
  return (
    <>
      <Tabs
        label="Фильтр запросов"
        items={[
          { value: 'all', label: 'Все запросы' },
          { value: 'errors', label: 'Ошибки' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <table className={s.table}>
        <thead>
          <tr>
            <th>Запрос</th>
            <th>Длительность</th>
            <th>Результат</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td data-label="ID" className={p.code}>
                {event.id}
                <small>09:10 · внешний сервис</small>
              </td>
              <td data-label="Длительность">{event.duration}</td>
              <td data-label="Результат">{event.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={p.note}>
        req-0141: превышено время ожидания. Полный текст диалога и ключи здесь не отображаются.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          recordAdmin('Изменение системной инструкции ИИ', (current) => ({
            ...current,
            instruction: instruction.trim(),
          }))
        }}
      >
        <Field label="Системная инструкция">
          <textarea
            required
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            maxLength={4000}
          />
        </Field>
        <Button type="submit" disabled={!instruction.trim()}>
          Сохранить инструкцию
        </Button>
      </form>
    </>
  )
}
export function AdminTemplatesPage() {
  const { data, recordAdmin } = useApp()
  return (
    <>
      <div className={p.stack}>
        {data.templates.map((template) => (
          <Card key={template.id}>
            <Badge>{template.active ? 'Активен' : 'Отключён'}</Badge>
            <h3>{template.title}</h3>
            <p className={p.muted}>
              {template.category} ·{' '}
              {template.days.length === 7
                ? 'Каждый день'
                : template.days.map((day) => weekLabels[day]).join(', ')}
            </p>
            <div className={p.row}>
              <Link className={p.textButton} to={`/admin/templates/${template.id}/edit`}>
                Редактировать
              </Link>
              <button
                className={p.textButton}
                onClick={() =>
                  recordAdmin(
                    `${template.active ? 'Отключение' : 'Включение'} шаблона ${template.title}`,
                    (current) => ({
                      ...current,
                      templates: current.templates.map((item) =>
                        item.id === template.id ? { ...item, active: !item.active } : item,
                      ),
                    }),
                  )
                }
              >
                {template.active ? 'Отключить' : 'Включить'}
              </button>
            </div>
          </Card>
        ))}
      </div>
      <div className={p.actions}>
        <Button to="/admin/templates/new">Создать шаблон</Button>
      </div>
    </>
  )
}
export function AdminTemplateEditorPage() {
  const { id } = useParams()
  const { data, recordAdmin } = useApp()
  const navigate = useNavigate()
  const previous = data.templates.find((item) => item.id === id)
  const [draft, setDraft] = useState(
    previous || {
      title: '',
      note: '',
      category: 'Обучение',
      days: allDays,
      time: '09:00',
      active: true,
    },
  )
  if (id && !previous) return <NotFoundPage />
  function save(event) {
    event.preventDefault()
    if (!draft.title.trim() || !draft.days.length) return
    recordAdmin(`${id ? 'Изменение' : 'Создание'} шаблона ${draft.title.trim()}`, (current) => ({
      ...current,
      templates: id
        ? current.templates.map((item) =>
            item.id === id ? { ...draft, title: draft.title.trim() } : item,
          )
        : [...current.templates, { ...draft, title: draft.title.trim(), id: crypto.randomUUID() }],
    }))
    navigate('/admin/templates')
  }
  return (
    <>
      <PageTitle
        title={id ? 'Изменить шаблон' : 'Новый шаблон'}
        subtitle="Основа небольшого выполнимого действия."
      />
      <form onSubmit={save}>
        <Field label="Название">
          <input
            required
            maxLength={80}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </Field>
        <Field label="Подсказка">
          <textarea
            maxLength={160}
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          />
        </Field>
        <Field label="Направление">
          <select
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
          >
            {['Обучение', 'Движение', 'Отдых', 'Самочувствие'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <h3>Дни недели</h3>
        <div className={p.days}>
          {weekLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={draft.days.includes(index)}
              onClick={() =>
                setDraft({
                  ...draft,
                  days: draft.days.includes(index)
                    ? draft.days.filter((day) => day !== index)
                    : [...draft.days, index],
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
            value={draft.time}
            onChange={(event) => setDraft({ ...draft, time: event.target.value })}
          />
        </Field>
        <div className={p.actions}>
          <Button type="submit" disabled={!draft.title.trim() || !draft.days.length}>
            Сохранить шаблон
          </Button>
          <Button variant="secondary" to="/admin/templates">
            Отмена
          </Button>
        </div>
      </form>
    </>
  )
}
export function AdminAuditPage() {
  const { data } = useApp()
  return (
    <>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Когда</th>
            <th>Операция</th>
            <th>Результат</th>
          </tr>
        </thead>
        <tbody>
          {data.audit.map((event) => (
            <tr key={event.id}>
              <td data-label="Время">
                {new Date(event.date).toLocaleString('ru-RU')}
                <small>admin@example.com</small>
              </td>
              <td data-label="Действие">{event.action}</td>
              <td data-label="Результат">{event.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={p.note}>Журнал доступен только для чтения.</p>
    </>
  )
}
