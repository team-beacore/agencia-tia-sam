import { cn } from '../../lib/cn'

type LogoProps = {
  desktop?: boolean
  compact?: boolean
  onClick?: () => void
}

/**
 * Marca da Agência Tia Sam (imagem oficial).
 * Um pouco maior no desktop; compacta ao rolar a página.
 */
export function Logo({ desktop = false, compact = false, onClick }: LogoProps) {
  const heightClass = compact ? 'h-9' : desktop ? 'h-12' : 'h-11'
  return (
    <a
      href="#inicio"
      onClick={onClick}
      aria-label="Agência Tia Sam — voltar ao início"
      className="group inline-flex items-center transition-colors duration-500"
    >
      <img
        src="/images/hero/logo.png"
        alt="Agência Tia Sam"
        className={cn(
          'w-auto object-contain transition-all duration-500 group-hover:-rotate-3',
          heightClass,
        )}
      />
    </a>
  )
}
