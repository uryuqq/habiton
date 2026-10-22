import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { usePwa } from '../hooks/usePwa'
import { useApp } from '../context/AppContext'
import { BackHeader, Badge, Button, Card, EmptyState, PageTitle, Plant } from '../components/UI/UI'
import { screenLinks } from '../routing/paths'
import p from './Pages.module.css'

export function InstallPage() {
  const { ready } = usePwa()
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone),
  )
  const [message, setMessage] = useState('')
  useEffect(() => {
    function available(event) {
      event.preventDefault()
      setPrompt(event)
    }
    function done() {
      setInstalled(true)
      setPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', available)
    window.addEventListener('appinstalled', done)
    return () => {
      window.removeEventListener('beforeinstallprompt', available)
      window.removeEventListener('appinstalled', done)
    }
  }, [])
  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    setMessage(
      choice.outcome === 'accepted' ? 'Установка подтверждена' : 'Установку можно выполнить позже',
    )
    setPrompt(null)
  }
  return (
    <>
      <BackHeader title="Хабитон под рукой" to="/profile" />
      <div className={p.page}>
        <EmptyState
          title={installed ? 'Хабитон уже открыт как приложение' : 'Ваш сад ближе'}
          image={<Plant />}
        >
          Открывайте привычки с главного экрана телефона, как обычное приложение.
        </EmptyState>
        {prompt && !installed && (
          <div className={p.actions}>
            <Button onClick={install}>Установить Хабитон</Button>
          </div>
        )}
        <Card>
          <h3>На iPhone через Safari</h3>
          <div className={p.steps}>
            {[
              'Откройте HTTPS-ссылку приложения в Safari.',
              'Откройте меню «Поделиться» и выберите «На экран Домой».',
              'Если доступно, включите «Открывать как веб-приложение», затем нажмите «Добавить».',
            ].map((text, index) => (
              <div className={p.step} key={text}>
                <span>{index + 1}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </Card>
        <p className={p.note}>
          Для установки и офлайн-режима на телефоне нужен доступный HTTPS-адрес. Адрес localhost
          относится только к устройству, на котором он открыт.
        </p>
        <p role="status" className={p.note}>
          {ready
            ? 'Офлайн-режим готов. Можно закрыть приложение и проверить запуск без сети.'
            : 'Офлайн-режим готовится после открытия собранной HTTPS-версии.'}
        </p>
        <Card>
          <h3>Что можно проверить</h3>
          <p className={p.muted}>
            Иконку, запуск отдельным окном, обе темы, создание привычек и локальное сохранение.
            После первого открытия дождитесь сообщения о готовности офлайн-режима.
          </p>
        </Card>
        {message && (
          <p role="status" className={p.note}>
            {message}
          </p>
        )}
      </div>
    </>
  )
}
export function DataPage() {
  return (
    <>
      <BackHeader title="О ваших данных" to="/profile" />
      <div className={p.page}>
        <PageTitle
          title="Понятно, что остаётся с нами"
          subtitle="Как работает текущая демонстрационная версия."
        />
        <div className={p.stack}>
          {[
            [
              'На этом устройстве',
              'Привычки, отметки, настройки и диалоги сохраняются в хранилище браузера. Очистка данных сайта удалит их.',
            ],
            [
              'Учётная запись',
              'Настоящей регистрации нет. Введённый пароль не сохраняется и не отправляется. Используйте вымышленные данные.',
            ],
            [
              'Диалог с помощником',
              'Внешняя языковая модель не подключена. Ответы создаются по локальному демонстрационному сценарию.',
            ],
            [
              'Демонстрационная админка',
              'Не управляет реальными пользователями. Защита ролей на клиенте показывает будущий сценарий и не заменяет серверную проверку.',
            ],
            [
              'Будущая версия',
              'После подключения Laravel данные будут храниться в MySQL. Состав передаваемых данных и правила удаления потребуется описать отдельно.',
            ],
          ].map(([title, text]) => (
            <Card key={title}>
              <h3>{title}</h3>
              <p className={p.muted}>{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
export function OfflinePage() {
  const { online } = useApp()
  return (
    <>
      <BackHeader title="Без сети" />
      <div className={p.page}>
        <EmptyState
          title={online ? 'Подключение доступно' : 'Ваши привычки на месте'}
          image={<Plant />}
        >
          Сохранённые данные доступны для просмотра. Для изменения привычек и новых отметок
          восстановите подключение.
        </EmptyState>
        <Badge>{online ? 'Сеть доступна' : 'Офлайн'}</Badge>
        <div className={p.actions}>
          <Button to="/today">Открыть сохранённый день</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Проверить подключение
          </Button>
        </div>
        <p className={p.note}>
          Очередь отправки офлайн-отметок не реализована. Демоданные остаются локальными и после
          восстановления сети.
        </p>
      </div>
    </>
  )
}
export function NotFoundPage() {
  return (
    <>
      <BackHeader title="Страница недоступна" />
      <div className={p.page}>
        <EmptyState
          title="Здесь пока ничего нет"
          image={<Plant />}
          action={<Button to="/today">На сегодня</Button>}
        >
          Возможно, ссылка устарела. Ваши привычки можно открыть на экране «Сегодня».
        </EmptyState>
        <p className={p.muted}>Ошибка 404</p>
      </div>
    </>
  )
}
export function ScreensPage() {
  const { startDemo } = useApp()
  return (
    <>
      <BackHeader title="Все экраны" to="/profile" />
      <div className={`${p.page} ${p.wide}`}>
        <PageTitle
          title="Фронтенд Хабитона"
          subtitle="Маршруты и состояния из дизайн-макетов. Все действия используют локальные демонстрационные данные."
        />
        <div className={p.screenGrid}>
          {screenLinks.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => {
                if (to.startsWith('/admin')) startDemo('admin')
                else if (!['/', '/login', '/signup', '/data', '/install'].includes(to)) startDemo()
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
