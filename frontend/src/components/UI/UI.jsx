import { asset } from '../../utils/assets'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronLeft, X } from 'lucide-react'
import s from './UI.module.css'

export function Button({ children, variant = 'primary', to, className = '', ...props }) {
  const classes = `${s.button} ${s[variant]} ${className}`
  return to ? (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  ) : (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
export function TextLink({ to, children, ...props }) {
  return (
    <Link className={s.textLink} to={to} {...props}>
      {children}
    </Link>
  )
}
export function Card({ children, className = '', ...props }) {
  return (
    <section className={`${s.card} ${className}`} {...props}>
      {children}
    </section>
  )
}
export function Badge({ children }) {
  return <span className={s.badge}>{children}</span>
}
export function Field({ label, error, hint, children }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      {children}
      {error && (
        <span className={s.error} role="alert">
          {error}
        </span>
      )}
      {hint && <small>{hint}</small>}
    </label>
  )
}
export function PageTitle({ title, subtitle, badge }) {
  return (
    <div className={s.pageTitle}>
      {badge && <Badge>{badge}</Badge>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
export function BackHeader({ title, to = '/today' }) {
  return (
    <header className={s.backHeader}>
      <Link to={to} aria-label="Назад">
        <ChevronLeft size={22} />
      </Link>
      <h2>{title}</h2>
    </header>
  )
}
export function SectionHeading({ children, to, link }) {
  return (
    <div className={s.sectionHeading}>
      <h2>{children}</h2>
      {to && (
        <TextLink to={to}>
          {link || 'Открыть'} <ArrowRight size={16} />
        </TextLink>
      )}
    </div>
  )
}
export function EmptyState({ title, children, image, action }) {
  return (
    <div className={s.empty}>
      {image}
      <h2>{title}</h2>
      <p>{children}</p>
      {action && <div className={s.actions}>{action}</div>}
    </div>
  )
}
export function Checkbox({ label, checked, onChange, disabled = false }) {
  return (
    <label className={s.checkbox}>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span aria-hidden="true">
        <svg className={s.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12 4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className={s.srOnly}>{label}</span>}
    </label>
  )
}
export function Tabs({ items, value, onChange, label }) {
  return (
    <div className={s.tabs} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.value}
          aria-pressed={value === item.value}
          className={value === item.value ? s.selected : ''}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
export function Modal({ title, children, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const node = dialog.current
    node.showModal()
    return () => node.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className={s.modal}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
      aria-labelledby="modal-title"
    >
      <button className={s.close} aria-label="Закрыть" onClick={onClose}>
        <X size={22} />
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  )
}
export function ConfirmDialog({ title, children, onConfirm, onClose, confirm = 'Подтвердить' }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{children}</p>
      <div className={s.actions}>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={onConfirm}>{confirm}</Button>
      </div>
    </Modal>
  )
}
export function Plant({ small = false }) {
  return (
    <img
      className={small ? s.plantSmall : s.plant}
      src={asset('/design/5c9927f9-1d70-497a-a17c-16e910faa17f.svg')}
      width="140"
      height="150"
      alt="Зелёное растение в терракотовом горшке"
    />
  )
}
