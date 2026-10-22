import { asset } from '../../utils/assets'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { WifiOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { displayDate } from '../../utils/dates'
import s from './Layout.module.css'

const links = [
  {
    to: '/today',
    label: 'Сегодня',
    image: '/design/4a076421-9aef-4c38-81d0-fc9d39ecd07c.svg',
    matches: ['/today', '/habits', '/empty', '/rest'],
  },
  {
    to: '/progress',
    label: 'Прогресс',
    image: '/design/06e2f56a-0602-42ed-90cd-1481e6fc86a4.svg',
    matches: ['/progress', '/garden'],
  },
  {
    to: '/coach',
    label: 'Помощник',
    image: '/design/cdad0237-5a5e-45a1-a47a-9ab1963efac4.svg',
    matches: ['/coach', '/coach-error'],
  },
  {
    to: '/profile',
    label: 'Профиль',
    image: '/design/443a61d4-2a39-4fa7-aa58-1895c3e93356.svg',
    matches: ['/profile'],
  },
]
const titles = {
  '/today': ['Сегодня', 'date'],
  '/habits': ['Все привычки', 'Ваш личный ритм'],
  '/progress': ['Ваш прогресс', 'Небольшие шаги складываются'],
  '/garden': ['Мой сад', 'Рост, который остаётся с вами'],
  '/coach': ['Помощник', 'Начнём с того, что важно вам'],
  '/coach-error': ['Помощник', 'Продолжим, когда будет удобно'],
  '/profile': ['Профиль', 'Ваше пространство'],
  '/empty': ['Сегодня', 'Начнём с одного небольшого шага'],
  '/rest': ['День без плана', 'Отдых — часть расписания'],
  '/offline': ['Без сети', 'Сохранённый вид'],
}
export function Layout() {
  const { pathname } = useLocation()
  const { data, online, today, toast } = useApp()
  const config = titles[pathname]
  const isAdmin = pathname.startsWith('/admin')
  const withNavigation = Boolean(config && pathname !== '/offline')
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${isAdmin ? 'Администрирование' : config?.[0] || 'Ваше пространство'} · Хабитон`
  }, [pathname, isAdmin, config])
  return (
    <div className={s.layout}>
      <a href="#main" className={s.skip}>
        Перейти к содержимому
      </a>
      {!online && (
        <div className={s.offline} role="status">
          <WifiOff size={17} /> Без сети · доступен просмотр сохранённых данных{' '}
          <Link to="/offline">Подробнее</Link>
        </div>
      )}
      {config && (
        <header className={s.header}>
          <div>
            <h1>{config[0]}</h1>
            <p>
              {config[1] === 'date'
                ? displayDate(today, { weekday: 'long', day: 'numeric', month: 'long' })
                : config[1]}
            </p>
          </div>
          <Link to="/profile" className={s.avatar} aria-label="Профиль">
            {data.profile.name.charAt(0)}
          </Link>
        </header>
      )}
      {isAdmin && (
        <header className={`${s.header} ${s.adminHeader}`}>
          <div>
            <h1>Администрирование</h1>
            <p>Хабитон</p>
          </div>
          <Link to="/today" className={s.returnLink}>
            В приложение
          </Link>
        </header>
      )}
      <div className={withNavigation ? s.workspace : ''}>
        {withNavigation && (
          <nav className={s.navigation} aria-label="Основные разделы">
            {links.map(({ to, label, image, matches }) => (
              <NavLink key={to} to={to} className={matches.includes(pathname) ? s.active : ''}>
                <img src={asset(image)} width="22" height="22" alt="" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
        <main id="main" tabIndex="-1" className={withNavigation ? s.content : s.standalone}>
          <Outlet />
        </main>
      </div>
      {toast && (
        <div role="status" className={s.toast}>
          {toast}
        </div>
      )}
    </div>
  )
}
