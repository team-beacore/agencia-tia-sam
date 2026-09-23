import { cn } from '../../lib/cn'

type LogoProps = {
  desktop?: boolean
  compact?: boolean
  /** Sobre fundo escuro (ex.: hero mobile com foto) — nome em tom claro. */
  onDark?: boolean
  onClick?: () => void
}

/**
 * Marca da Agência Tia Sam: emblema dourado oficial + nome em serifa.
 * Um pouco maior no desktop; compacta ao rolar a página.
 */
export function Logo({ desktop = false, compact = false, onDark = false, onClick }: LogoProps) {
  const heightClass = compact ? 'h-10' : desktop ? 'h-14' : 'h-12'
  return (
    <a
      href="#inicio"
      onClick={onClick}
      aria-label="Agência Tia Sam — voltar ao início"
      className="group inline-flex items-center gap-2.5 transition-colors duration-500"
    >
      <img
        src="/images/brand/logo-mark.png"
        alt=""
        width={256}
        height={256}
        className={cn(
          'aspect-square w-auto object-contain transition-all duration-500 group-hover:-rotate-3',
          heightClass,
        )}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[9px] font-semibold uppercase tracking-[0.34em] transition-colors duration-500',
            onDark ? 'text-wheat/90' : 'text-bronze/80',
          )}
        >
          Agência
        </span>
        <span
          className={cn(
            'font-serif font-semibold tracking-tight transition-all duration-500',
            compact ? 'text-[21px]' : desktop ? 'text-[26px]' : 'text-[23px]',
            onDark ? 'text-wheat' : 'text-gold',
          )}
        >
          Tia Sam
        </span>
      </span>
    </a>
  )
}
