import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bell, ChevronRight, Leaf, Settings2, ShieldCheck, Smartphone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BackHeader, Button, ConfirmDialog, Field, PageTitle, Tabs } from '../components/UI/UI'
import p from './Pages.module.css'

export function ProfilePage() {
  const { data, setData, setSession, resetDemo, startDemo } = useApp()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(null)
  const sections = [
    { to: '/settings', title: 'Настройки', subtitle: 'Тема и часовой пояс', icon: Settings2 },
    { to: '/reminders', title: 'Напоминания', subtitle: 'Условия и разрешения', icon: Bell },
    {
      to: '/install',
      title: 'Установить Хабитон',
      subtitle: 'На главный экран телефона',
      icon: Smartphone,
    },
    {
      to: '/data',
      title: 'О ваших данных',
      subtitle: 'Что сохраняется и зачем',
      icon: ShieldCheck,
    },
    { to: '/garden', title: 'Мой сад', subtitle: 'Ваш накопленный рост', icon: Leaf },
  ]
  function confirmAction() {
    if (confirm === 'logout') {
      setSession(null)
      navigate('/')
    }
    if (confirm === 'reset') resetDemo()
    if (confirm === 'delete') {
      setData((current) => ({
        ...current,
        profile: { name: 'Гость', email: '' },
        habits: [],
        logs: [],
        dialogues: [],
      }))
      setSession(null)
      navigate('/')
    }
    setConfirm(null)
  }
  return (
    <>
      <div className={p.row}>
        <span className={p.icon}>{data.profile.name.charAt(0)}</span>
        <div style={{ flex: 1 }}>
          <h2>{data.profile.name}</h2>
          <p className={p.muted}>{data.profile.email}</p>
        </div>
      </div>
      <div className={p.list}>
        {sections.map(({ to, title, subtitle, icon: Icon }) => (
          <Link key={to} to={to}>
            <Icon size={22} />
            <span>
              {title}
              <small>{subtitle}</small>
            </span>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
      <div className={p.actions}>
        <Button variant="secondary" onClick={() => setConfirm('logout')}>
          Выйти
        </Button>
        <Button variant="quiet" to="/admin" onClick={() => startDemo('admin')}>
          Посмотреть демо админки
        </Button>
        <Button variant="quiet" onClick={() => setConfirm('reset')}>
          Восстановить демоданные
        </Button>
        <button className={`${p.textButton} ${p.danger}`} onClick={() => setConfirm('delete')}>
          Удалить локальные данные профиля
        </button>
      </div>
      <p className={p.note}>
        Это локальная демонстрация: данные не отправляются на сервер и не синхронизируются между
        устройствами.
      </p>
      {confirm && (
        <ConfirmDialog
          title={
            confirm === 'logout'
              ? 'Выйти из демоверсии?'
              : confirm === 'reset'
                ? 'Восстановить примеры?'
                : 'Удалить локальные данные?'
          }
          onClose={() => setConfirm(null)}
          onConfirm={confirmAction}
        >
          {confirm === 'logout'
            ? 'Ваши демоданные останутся в этом браузере.'
            : confirm === 'reset'
              ? 'Ваши изменения будут заменены исходным примером.'
              : 'Привычки, отметки и диалоги этого демопрофиля будут удалены из текущего приложения.'}
        </ConfirmDialog>
      )}
    </>
  )
}
export function SettingsPage() {
  const { data, setData, settings, setSettings, setToast } = useApp()
  const [name, setName] = useState(data.profile.name)
  function save(event) {
    event.preventDefault()
    if (!name.trim()) return
    setData((current) => ({ ...current, profile: { ...current.profile, name: name.trim() } }))
    setToast('Настройки сохранены на этом устройстве')
  }
  return (
    <>
      <BackHeader title="Настройки" to="/profile" />
      <form className={p.page} onSubmit={save}>
        <Field label="Как вас называть?">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
          />
        </Field>
        <Field label="Часовой пояс" hint="Определяет текущую дату и расписание.">
          <select
            value={settings.timezone}
            onChange={(event) =>
              setSettings((current) => ({ ...current, timezone: event.target.value }))
            }
          >
            <option value="Europe/Moscow">Москва · UTC+3</option>
            <option value="Asia/Yekaterinburg">Екатеринбург · UTC+5</option>
            <option value="Asia/Novosibirsk">Новосибирск · UTC+7</option>
            <option value="Europe/Kaliningrad">Калининград · UTC+2</option>
          </select>
        </Field>
        <h3>Внешний вид</h3>
        <div className={p.actions}>
          <Tabs
            label="Тема приложения"
            items={[
              { value: 'light', label: 'Светлый' },
              { value: 'dark', label: 'Тёмный' },
              { value: 'system', label: 'Системный' },
            ]}
            value={settings.theme}
            onChange={(theme) => setSettings((current) => ({ ...current, theme }))}
          />
        </div>
        <label className={p.row}>
          <span>
            Уменьшить движение
            <small className={p.muted} style={{ display: 'block' }}>
              Без декоративной анимации
            </small>
          </span>
          <input
            type="checkbox"
            style={{ width: 24, height: 24, minHeight: 24 }}
            checked={settings.reducedMotion}
            onChange={(event) =>
              setSettings((current) => ({ ...current, reducedMotion: event.target.checked }))
            }
          />
        </label>
        <div className={p.actions}>
          <Button type="submit">Сохранить настройки</Button>
        </div>
      </form>
    </>
  )
}
export function RemindersPage() {
  return (
    <>
      <BackHeader title="Напоминания" to="/profile" />
      <div className={p.page}>
        <PageTitle
          title="Мягкое напоминание"
          subtitle="О подходящем времени, которое вы выбрали сами."
        />
        <p className={p.note}>
          Фоновая доставка уведомлений пока не подключена. Сохранённое время привычки — это
          расписание, а не гарантированное уведомление.
        </p>
        <p>
          В полной версии потребуется подключить серверную отправку и проверить поддержку
          уведомлений на устройстве. Сейчас можно проверить внешний вид и настройку времени.
        </p>
        <div className={p.actions}>
          <Button to="/habits">Посмотреть расписание</Button>
          <Button variant="secondary" to="/install">
            Установить приложение
          </Button>
        </div>
      </div>
    </>
  )
}
