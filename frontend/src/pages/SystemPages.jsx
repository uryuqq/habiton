import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { BackHeader, Badge, Button, Card, EmptyState, PageTitle, Plant } from '../components/UI/UI'
import p from './Pages.module.css'

export function InstallPage() {
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
        <PageTitle title="Понятно, что остаётся с нами" subtitle="Что сохраняется и зачем." />
        <div className={p.stack}>
          {[
            [
              'Учётная запись',
              'Имя и email используются в профиле. Пароль не сохраняется на устройстве.',
            ],
            [
              'Привычки и отметки',
              'Расписание и история сохраняются в этом браузере, чтобы показывать ваш прогресс. Очистка данных сайта удалит их.',
            ],
            [
              'Диалоги',
              'Историю сообщений можно открыть в разделе помощника. Она сохраняется на этом устройстве.',
            ],
            [
              'Служебный доступ',
              'Мониторинг содержит технические события без текста личной переписки.',
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
