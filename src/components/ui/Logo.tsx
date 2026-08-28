import { cn } from '../../lib/cn'

type LogoProps = {
  dark?: boolean
  compact?: boolean
  onClick?: () => void
}

/**
 * Marca da Agência Tia Sam (imagem oficial).
 * Em fundos transparentes (mobile), recebe um fundo claro para se destacar.
 */
export function Logo({ dark = false, compact = false, onClick }: LogoProps) {
  return (
    <a
      href="#inicio"
      onClick={onClick}
      aria-label="Agência Tia Sam — voltar ao início"
      className="group inline-flex items-center transition-colors duration-500"
    >
      <span
        className={cn(
          'flex items-center justify-center transition-all duration-500 group-hover:-rotate-3',
          dark && 'rounded-full bg-white/95 p-2 shadow-soft backdrop-blur-sm',
        )}
      >
        <img
          src="/images/hero/logo.png"
          alt="Agência Tia Sam"
          className={cn(
            'h-11 w-auto object-contain transition-all duration-500',
            compact && 'h-9',
          )}
        />
      </span>
    </a>
  )
}
