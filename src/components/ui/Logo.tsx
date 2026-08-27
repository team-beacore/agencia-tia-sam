import { cn } from '../../lib/cn'

type LogoProps = {
  dark?: boolean
  compact?: boolean
  onClick?: () => void
}

/**
 * Marca da Agência Tia Sam:
 * monograma em cápsula + wordmark em duas linhas.
 */
export function Logo({ dark = false, compact = false, onClick }: LogoProps) {
  return (
    <a
      href="#inicio"
      onClick={onClick}
      aria-label="Agência Tia Sam — voltar ao início"
      className="group inline-flex items-center gap-3 transition-colors duration-500"
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] font-serif text-[22px] font-bold transition-all duration-500 group-hover:-rotate-3',
          dark ? 'bg-white text-grape shadow-soft' : 'bg-grape text-white shadow-soft',
        )}
      >
        S
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[9.5px] font-semibold uppercase tracking-[0.3em] transition-colors duration-500',
            dark ? 'text-lavender/70' : 'text-muted',
          )}
        >
          Agência
        </span>
        <span
          className={cn(
            'mt-1 text-[22px] font-extrabold tracking-tight transition-colors duration-500',
            dark ? 'text-white' : 'text-ink',
            compact && 'text-[19px]',
          )}
        >
          Tia Sam
        </span>
      </span>
    </a>
  )
}
