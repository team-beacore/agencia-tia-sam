import { useCallback, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { IMAGES } from '../../config/images'
import { SectionHeading } from '../ui/SectionHeading'
import { Container } from '../ui/Container'
import { useWizard } from '../wizard/WizardContext'
import type { WizardFlowId } from '../../config/wizard'

type HubPath = {
  id: WizardFlowId
  number: string
  title: string
  description: string
  image: string
  alt: string
}

const PATHS: HubPath[] = [
  {
    id: 'hire',
    number: '01',
    title: 'Preciso contratar',
    description: 'Encontrar uma profissional para a minha família.',
    image: IMAGES.hub.family,
    alt: IMAGES.hub.familyAlt,
  },
  {
    id: 'professional',
    number: '02',
    title: 'Quero fazer parte',
    description: 'Trabalhar através da Agência Tia Sam.',
    image: IMAGES.hub.professional,
    alt: IMAGES.hub.professionalAlt,
  },
  {
    id: 'company',
    number: '03',
    title: 'Sou uma empresa',
    description: 'Profissionais para a minha empresa.',
    image: IMAGES.hub.company,
    alt: IMAGES.hub.companyAlt,
  },
]

export function DecisionHub() {
  const [active, setActive] = useState(0)
  const { openWizard } = useWizard()
  const reduce = useReducedMotion()

  const handleActivate = useCallback(
    (index: number) => {
      setActive(index)
      openWizard(PATHS[index].id)
    },
    [openWizard],
  )

  return (
    <section aria-labelledby="hub-title" className="relative py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Como podemos ajudar?"
          title={
            <span id="hub-title">
              Três caminhos. <span className="accent-serif text-grape">O mesmo cuidado.</span>
            </span>
          }
          intro="Seja para a sua casa, para a sua família ou para a sua empresa — a Tia Sam começa do mesmo jeito: ouvindo você."
        />

        <div className="mt-12 flex flex-col gap-4 lg:mt-16 lg:h-[540px] lg:flex-row">
          {PATHS.map((path, i) => {
            const isActive = active === i
            return (
              <button
                key={path.id}
                type="button"
                onClick={() => handleActivate(i)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-label={`${path.title} — ${path.description}`}
                className={cn(
                  'group relative min-h-[300px] flex-1 overflow-hidden rounded-[26px] text-left transition-all duration-700 ease-soft focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 sm:min-h-[360px] lg:min-h-0',
                  'lg:transition-[flex-grow]',
                  isActive ? 'lg:flex-[2.4]' : 'lg:flex-[1]',
                )}
              >
                {/* Fotografia */}
                <img
                  src={path.image}
                  alt={path.alt}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-soft',
                    isActive ? 'scale-105' : 'scale-100 group-hover:scale-[1.03]',
                  )}
                />
                {/* Overlay para legibilidade */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/35 to-night/5 transition-opacity duration-700"
                />

                {/* Número */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-6 top-6 font-serif text-4xl italic text-white/70 transition-all duration-500',
                    isActive && 'text-white',
                  )}
                >
                  {path.number}
                </span>

                {/* Conteúdo */}
                <span className="absolute inset-x-0 bottom-0 block p-6 sm:p-7">
                  <span
                    className={cn(
                      'block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70',
                      isActive && 'text-lilac',
                    )}
                  >
                    {path.id === 'hire' ? 'Para famílias' : path.id === 'professional' ? 'Para profissionais' : 'Para empresas'}
                  </span>
                  <span className="mt-2 block text-[clamp(1.4rem,2.6vw,1.9rem)] font-extrabold leading-tight tracking-tight text-white">
                    {path.title}
                  </span>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        key="desc"
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: 8 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-3 block max-w-sm text-[15px] leading-relaxed text-lavender/90"
                      >
                        {path.description}
                        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-grape shadow-soft transition-transform duration-300 group-hover:translate-x-0.5">
                          Começar
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted lg:text-left">
          Escolha com calma. A gente cuida do resto.
        </p>
      </Container>
    </section>
  )
}
