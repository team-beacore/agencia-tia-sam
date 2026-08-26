import type { ReactNode, MouseEventHandler } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'outline' | 'light' | 'outlineLight' | 'ghost'

type CTAButtonProps = {
  children: ReactNode
  variant?: Variant
  href?: string
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
  className?: string
  external?: boolean
  ariaLabel?: string
}

const base =
  'group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[15px] font-semibold transition-all duration-300 ease-soft select-none cursor-pointer'

const variants: Record<Variant, string> = {
  primary: 'bg-grape text-white hover:bg-plum hover:-translate-y-0.5 shadow-soft hover:shadow-lift',
  outline:
    'border border-grape/25 text-grape hover:border-grape/60 hover:bg-lavender/50 hover:-translate-y-0.5',
  light: 'bg-white text-grape hover:bg-lavender hover:-translate-y-0.5 shadow-soft',
  outlineLight:
    'border border-white/35 text-white hover:border-white/75 hover:bg-white/10 hover:-translate-y-0.5',
  ghost: 'text-grape hover:text-plum underline-offset-4 hover:underline px-2 py-1',
}

/** Botão / link de chamada para ação em três estilos da marca. */
export function CTAButton({
  children,
  variant = 'primary',
  href,
  onClick,
  className,
  external = false,
  ariaLabel,
}: CTAButtonProps) {
  const cls = cn(base, variants[variant], className)

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cls}
        aria-label={ariaLabel}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  )
}
