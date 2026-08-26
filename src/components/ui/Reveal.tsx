import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  x?: number
  scale?: number
  duration?: number
  className?: string
  once?: boolean
}

/**
 * Revela conteúdo suavemente quando entra na viewport.
 * Respeita prefers-reduced-motion (aparece direto).
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  x = 0,
  scale = 1,
  duration = 0.8,
  className,
  once = true,
}: RevealProps) {
  const reduce = useReducedMotion()

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, margin: '-64px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
