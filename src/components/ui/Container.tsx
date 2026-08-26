import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ContainerProps = {
  children: ReactNode
  className?: string
  wide?: boolean
}

/** Contêiner centralizado com respiro lateral consistente. */
export function Container({ children, className, wide = false }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-5 sm:px-8', wide ? 'max-w-[1440px]' : 'max-w-[1200px]', className)}>
      {children}
    </div>
  )
}
