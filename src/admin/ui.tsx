import { useEffect, useRef, useState } from 'react'
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { Loader2, Upload, X, Trash2, Plus } from 'lucide-react'
import { api } from './api'

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ---------- Botão ---------- */
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger'
export function Button({
  children,
  variant = 'primary',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grape/40'
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-grape text-white hover:bg-plum shadow-soft',
    outline: 'border border-line bg-white text-ink hover:border-grape/40 hover:bg-lavender/30',
    ghost: 'text-grape hover:bg-lavender/50',
    danger: 'bg-magenta text-white hover:bg-magenta/90',
  }
  return (
    <button className={cx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  )
}

/* ---------- Campos ---------- */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/50 transition-colors focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputCls, className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, 'min-h-[96px] resize-y', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputCls, 'appearance-none', className)} {...rest}>
      {children}
    </select>
  )
}

/* ---------- Toggle ---------- */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
          checked ? 'bg-grape' : 'bg-line',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
    </button>
  )
}

/* ---------- Card ---------- */
export function Card({ title, subtitle, actions, children, className }: {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('rounded-2xl border border-line bg-white shadow-soft', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
          <div>
            {title ? <h3 className="text-[15px] font-bold text-ink">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

/* ---------- Badge ---------- */
export function Badge({ tone = 'neutral', children }: { tone?: 'green' | 'amber' | 'red' | 'neutral' | 'violet'; children: ReactNode }) {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    violet: 'bg-lavender text-grape border-grape/20',
    neutral: 'bg-paper text-muted border-line',
  } as const
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', map[tone])}>
      {children}
    </span>
  )
}

/* ---------- Spinner / EmptyState ---------- */
export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-grape" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-night/55 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-cream shadow-lift sm:rounded-[24px]',
          wide ? 'sm:max-w-4xl' : 'sm:max-w-xl',
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
          <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-lavender/70 hover:text-grape"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ---------- Tabela responsiva (cards no mobile) ---------- */
export function ResponsiveTable<T extends { id?: number }>({
  columns,
  rows,
  renderRow,
  empty,
}: {
  columns: { key: string; label: string; className?: string }[]
  rows: T[]
  renderRow: (row: T) => ReactNode
  empty?: ReactNode
}) {
  if (rows.length === 0) return empty ?? null
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line/70 bg-paper/50 text-[11px] uppercase tracking-wider text-muted">
            {columns.map((c) => (
              <th key={c.key} className={cx('px-4 py-3 font-semibold', c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">{rows.map(renderRow)}</tbody>
      </table>
    </div>
  )
}

/* ---------- Upload de imagem ---------- */
export function ImageUpload({
  value,
  onChange,
  label = 'Imagem',
}: {
  value: string
  onChange: (url: string) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const r = await api.upload(file)
      onChange(r.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      <div className="flex items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-paper">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? 'Enviando...' : 'Enviar imagem'}
            </Button>
            {value ? (
              <Button type="button" variant="ghost" onClick={() => onChange('')}>
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            ) : null}
          </div>
          {value ? <span className="truncate text-xs text-muted">{value}</span> : null}
          {error ? <span className="text-xs font-medium text-magenta">{error}</span> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

/* ---------- Barra de ações de linha (editar/excluir) ---------- */
export function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onEdit ? (
        <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={onEdit}>
          Editar
        </Button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Excluir"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-magenta"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
