import { cn } from '../../lib/cn'

/**
 * Renderiza um título com a última palavra em destaque serifado/itálico,
 * preservando a identidade visual das seções da Agência Tia Sam.
 */
export function AccentTitle({ text, className }: { text: string; className?: string }) {
  const parts = text.trim().split(/\s+/)
  const lastRaw = parts[parts.length - 1] ?? ''
  const punct = lastRaw.match(/[.!?]+$/)?.[0] ?? ''
  const lastWord = lastRaw.replace(/[.!?]+$/, '')
  const before = parts.slice(0, -1).join(' ')

  return (
    <span className={cn(className)}>
      {before ? <>{before}{' '}</> : null}
      <span className="accent-serif text-grape">{lastWord}</span>
      {punct}
    </span>
  )
}
