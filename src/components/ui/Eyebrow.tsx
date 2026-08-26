import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type EyebrowProps = {
  children: ReactNode
  dark?: boolean
  className?: string
  withLine?: boolean
}

/** Rótulo pequeno em caixa alta — o "eyebrow" editorial. */
export function Eyebrow({ children, dark = false, className, withLine = true }: EyebrowProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em]',
        dark ? 'text-lilac' : 'text-grape',
        className,
      )}
    >
      {withLine && <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />}
      <span>{children}</span>
    </p>
  )
}
