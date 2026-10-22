import { asset } from '../utils/assets'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BackHeader, Badge, Button, Card, Field, PageTitle, Plant } from '../components/UI/UI'
import s from './PublicPages.module.css'
import p from './Pages.module.css'

export function LandingPage() {
  const { startDemo } = useApp()
  return (
    <>
      <header className={s.header}>
        <Link to="/" aria-label="Хабитон — главная">
          <img className={s.logoLight} src={asset('/brand/logo.svg')} alt="хабитон." />
          <img className={s.logoDark} src={asset('/brand/logo-dark.svg')} alt="хабитон." />
        </Link>
        <Link to="/login">Войти</Link>
      </header>
      <div className={s.landing}>
        <div className={s.hero}>
          <div>
            <Badge>Ваше пространство для привычек</Badge>
            <h1>
              Маленькие действия.
              <br />
              <em>Видимый рост.</em>
            </h1>
            <p>
              Превратите цель в понятный план. Отмечайте небольшие шаги и наблюдайте, как растёт ваш
              сад.
            </p>
            <Button to="/signup">
              Начать свой путь <ArrowRight size={20} />
            </Button>
            <small>С помощью ИИ или самостоятельно</small>
          </div>
          <div className={s.illustration}>
            <img
              src={asset('/design/61fc413d-a931-4e0f-b626-f1d7ac2c884d.svg')}
              width="150"
              height="190"
              alt="Растение в горшке"
            />
            <Card>
              <Badge>Мой день</Badge>
              <strong>Читать 10 минут</strong>
              <small>Небольшое время для себя</small>
              <p>✓ Выполнено</p>
            </Card>
          </div>
        </div>
        <div className={s.intro}>
          <h2>От намерения к действию</h2>
          <div className={p.steps}>
            {[
              ['Расскажите о цели', 'Помощник предложит небольшой план.'],
              ['Выберите подходящее', 'Измените привычки и расписание под себя.'],
              ['Продолжайте понемногу', 'Отметки превращаются в историю и рост.'],
            ].map(([title, text], index) => (
              <div className={p.step} key={title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Card>
            <h3>Под рукой, как приложение</h3>
            <p>«Хабитон» можно установить на телефон.</p>
            <Link to="/install">
              Как установить <ArrowRight size={16} />
            </Link>
          </Card>
          <div className={p.actions}>
            <Button variant="secondary" to="/today" onClick={() => startDemo()}>
              Посмотреть демоверсию
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
export function AuthPage({ signup = false }) {
  const { startDemo } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [errors, setErrors] = useState({})
  function submit(event) {
    event.preventDefault()
    const next = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Введите корректный адрес почты'
    if (password.length < 8) next.password = 'Введите не менее 8 символов'
    setErrors(next)
    if (Object.keys(next).length) return
    startDemo('user', email.trim())
    setPassword('')
    navigate(signup ? '/onboarding' : '/today')
  }
  return (
    <>
      <BackHeader title={signup ? 'Создать аккаунт' : 'С возвращением'} to="/" />
      <div className={p.page}>
        <PageTitle
          title={signup ? 'Посадим первый росток?' : 'Продолжим понемногу'}
          subtitle={
            signup
              ? 'Ваш план, привычки и прогресс — в одном месте.'
              : 'Войдите, чтобы открыть свой день.'
          }
        />
        <form onSubmit={submit} noValidate>
          <Field label="Электронная почта" error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              required
            />
          </Field>
          <Field label="Пароль" error={errors.password} hint="Не менее 8 символов">
            <input
              type={visible ? 'text' : 'password'}
              autoComplete={signup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              required
            />
          </Field>
          <button className={p.textButton} type="button" onClick={() => setVisible(!visible)}>
            {visible ? 'Скрыть пароль' : 'Показать пароль'}
          </button>
          <p className={p.note}>
            Демонстрационная форма. Аккаунт не создаётся, пароль не сохраняется и никуда не
            отправляется. Для проверки используйте вымышленные данные.
          </p>
          <Link className={p.textButton} to="/data">
            Информация о данных
          </Link>
          <div className={p.actions}>
            <Button type="submit">
              {signup ? 'Продолжить в деморежиме' : 'Войти в деморежим'}
            </Button>
            <Button variant="secondary" to={signup ? '/login' : '/signup'}>
              {signup ? 'У меня уже есть аккаунт' : 'Создать аккаунт'}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                startDemo()
                navigate('/today')
              }}
            >
              Открыть без заполнения
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
