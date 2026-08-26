import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Reveal } from './Reveal'
import { Eyebrow } from './Eyebrow'

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  dark?: boolean
  align?: 'left' | 'center'
  className?: string
}

/** Cabeçalho padrão das seções — hierarquia editorial consistente. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  dark = false,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <Reveal>
        <Eyebrow dark={dark} className={cn(align === 'center' && 'justify-center')}>
          {eyebrow}
        </Eyebrow>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={cn(
            'tracking-headline text-balance mt-5 text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold leading-[1.06]',
            dark ? 'text-white' : 'text-ink',
          )}
        >
          {title}
        </h2>
      </Reveal>
      {intro ? (
        <Reveal delay={0.16}>
          <p
            className={cn(
              'mt-5 text-lg leading-relaxed',
              dark ? 'text-lavender/80' : 'text-muted',
            )}
          >
            {intro}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}
