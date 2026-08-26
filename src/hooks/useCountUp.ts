import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Contador animado que dispara quando o elemento entra na viewport.
 * Com reduced motion, salta direto para o valor final.
 */
export function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (reduce) {
      setValue(target)
      return
    }
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            const t0 = performance.now()
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / duration)
              const eased = 1 - Math.pow(1 - p, 3)
              setValue(Math.round(target * eased))
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            io.disconnect()
          }
        })
      },
      { threshold: 0.4 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [target, duration, reduce])

  return { value, ref }
}
