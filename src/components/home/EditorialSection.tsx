import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useSite } from '../../data/SiteContext'

/**
 * Pausa visual: fotografia de largura total com movimento sutil no scroll.
 */
export function EditorialSection() {
  const ref = useRef<HTMLElement>(null)
  const site = useSite()
  const reduce = useReducedMotion()
  const editorial = site.data.settings?.editorial ?? {}
  const imgs = site.data.settings?.images ?? {}
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1, 1.12])

  return (
    <section
      ref={ref}
      aria-label="Momento editorial"
      className="relative flex min-h-[72vh] items-center justify-center overflow-hidden sm:min-h-[80vh]"
    >
      <motion.div
        aria-hidden="true"
        style={reduce ? undefined : { y, scale }}
        className="absolute inset-0"
      >
        <img
          src={imgs.editorial || '/images/editorial/editorial-wide.jpg'}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-night/55" />
      </motion.div>

      <div className="relative z-10 max-w-4xl px-6 py-28 text-center sm:px-10">
        <motion.blockquote
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="accent-serif text-[clamp(1.9rem,5.4vw,3.4rem)] italic leading-[1.18] text-white"
        >
          {editorial.quote || '“Cuidar também é escolher com atenção.”'}
        </motion.blockquote>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 text-[11px] font-semibold uppercase tracking-[0.3em] text-lilac"
        >
          {editorial.attribution || 'Agência Tia Sam · Manaus'}
        </motion.p>
      </div>
    </section>
  )
}
