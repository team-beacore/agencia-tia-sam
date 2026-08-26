import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { IMAGES } from '../../config/images'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

const AUTOPLAY_MS = 4500

const STEPS = [
  {
    number: '01',
    title: 'Cadastro',
    description:
      'A profissional inicia seu cadastro conosco, apresentando dados básicos e a área de atuação de interesse.',
    image: IMAGES.process['01'],
    alt: IMAGES.process['01Alt'],
  },
  {
    number: '02',
    title: 'Triagem',
    description:
      'Realizamos uma análise inicial do perfil e das informações apresentadas para verificar se a profissional está alinhada aos nossos critérios.',
    image: IMAGES.process['02'],
    alt: IMAGES.process['02Alt'],
  },
  {
    number: '03',
    title: 'Documentação',
    description:
      'Conferimos os documentos necessários para garantir que todas as informações estejam corretas e atualizadas.',
    image: IMAGES.process['03'],
    alt: IMAGES.process['03Alt'],
  },
  {
    number: '04',
    title: 'Antecedentes',
    description:
      'Realizamos a verificação de antecedentes criminais como parte do nosso processo de segurança e responsabilidade.',
    image: IMAGES.process['04'],
    alt: IMAGES.process['04Alt'],
  },
  {
    number: '05',
    title: 'Referências',
    description:
      'Buscamos referências profissionais para conhecer melhor a experiência, postura e histórico de trabalho da candidata.',
    image: IMAGES.process['05'],
    alt: IMAGES.process['05Alt'],
  },
  {
    number: '06',
    title: 'Entrevista',
    description:
      'Após as análises, a profissional passa por uma entrevista para conhecermos melhor seu perfil, experiência e postura.',
    image: IMAGES.process['06'],
    alt: IMAGES.process['06Alt'],
  },
  {
    number: '07',
    title: 'Aprovação',
    description:
      'Somente após a conclusão das etapas e aprovação no processo a profissional passa a fazer parte da nossa seleção.',
    image: IMAGES.process['07'],
    alt: IMAGES.process['07Alt'],
  },
  {
    number: '08',
    title: 'Oportunidades',
    description:
      'Profissionais aprovadas passam a concorrer às oportunidades compatíveis com seu perfil e experiência.',
    image: IMAGES.process['08'],
    alt: IMAGES.process['08Alt'],
  },
] as const

const TOTAL = STEPS.length

export function ProcessTimeline() {
  const [active, setActive] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const sectionRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduce = usePrefersReducedMotion()

  const step = STEPS[active]

  // Pausa o autoplay quando a seção sai da viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const autoplay = !reduce && inView && !paused

  // Autoplay: avança após alguns segundos. Toda interação reinicia o ciclo.
  useEffect(() => {
    if (!autoplay) return
    const id = setTimeout(() => {
      setActive((a) => (a + 1) % TOTAL)
      setCycle((c) => c + 1)
    }, AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [autoplay, active, cycle])

  const select = useCallback((i: number) => {
    setActive(i)
    setCycle((c) => c + 1)
  }, [])

  const goTo = useCallback(
    (offset: number) => {
      select((active + offset + TOTAL) % TOTAL)
    },
    [active, select],
  )

  // Centraliza o item ativo no scroll horizontal (mobile)
  useEffect(() => {
    if (reduce) return
    stepRefs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active, reduce])

  // Pré-carrega a próxima imagem para transição sem "piscar"
  useEffect(() => {
    const next = STEPS[(active + 1) % TOTAL]
    const img = new Image()
    img.src = next.image
  }, [active])

  const onTimelineKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (active + 1) % TOTAL
      select(next)
      stepRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (active - 1 + TOTAL) % TOTAL
      select(prev)
      stepRefs.current[prev]?.focus()
    }
  }

  return (
    <section
      id="processo"
      aria-labelledby="process-title"
      className="relative overflow-hidden bg-gradient-to-b from-plum via-plum to-night py-24 sm:py-28"
    >
      {/* Textura sutil */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:28px_28px]" />
      </div>

      <Container>
        {/* Cabeçalho centralizado */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-lilac">
              <span aria-hidden="true" className="h-px w-8 bg-lilac opacity-50" />
              Como funciona
              <span aria-hidden="true" className="h-px w-8 bg-lilac opacity-50" />
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="process-title"
              className="tracking-headline text-balance mt-5 text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold leading-[1.06] text-white"
            >
              Por trás de cada indicação,{' '}
              <span className="text-lilac">existe um processo</span>.
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-lavender/80">
              Conheça cada etapa do nosso processo de seleção criterioso.
            </p>
          </Reveal>
        </div>

        {/* Área interativa (autoplay pausa com hover/foco) */}
        <div
          ref={sectionRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="mt-14 lg:mt-16"
        >
          {/* Timeline desktop */}
          <div
            role="tablist"
            aria-label="Etapas do processo de seleção"
            onKeyDown={onTimelineKeyDown}
            className="relative hidden select-none lg:block"
          >
            {/* Linha conectora */}
            <div aria-hidden="true" className="absolute inset-x-0 top-5 h-0.5 bg-lavender/15" />
            <div
              aria-hidden="true"
              className="absolute left-0 top-5 h-0.5 rounded-full bg-magenta/80 transition-all duration-500 ease-soft"
              style={{ width: `${(active / (TOTAL - 1)) * 100}%` }}
            />

            <div className="relative grid grid-cols-8">
              {STEPS.map((s, i) => {
                const isActive = active === i
                const isPast = active > i
                return (
                  <div key={s.number} className="flex flex-col items-center">
                    <button
                      type="button"
                      id={`process-tab-${i}`}
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Etapa ${s.number} — ${s.title}`}
                      ref={(el) => {
                        stepRefs.current[i] = el
                      }}
                      onClick={() => select(i)}
                      className="group flex flex-col items-center gap-3 focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-plum focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 text-[13px] font-bold transition-all duration-400',
                          isActive
                            ? 'border-magenta bg-magenta text-white shadow-[0_0_0_5px_rgba(194,37,92,0.22)]'
                            : isPast
                              ? 'border-lilac/60 bg-lilac/20 text-lilac'
                              : 'border-lavender/25 text-lavender/50 group-hover:border-lavender/60 group-hover:text-lavender/80',
                        )}
                      >
                        {s.number}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300',
                          isActive ? 'text-white' : isPast ? 'text-lilac/80' : 'text-lavender/50',
                        )}
                      >
                        {s.title}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Timeline mobile/tablet — navegação horizontal compacta */}
          <div
            role="tablist"
            aria-label="Etapas do processo de seleção"
            onKeyDown={onTimelineKeyDown}
            className="relative -mx-5 select-none lg:hidden sm:-mx-8"
          >
            <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-3 sm:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {STEPS.map((s, i) => {
                const isActive = active === i
                return (
                  <button
                    key={s.number}
                    type="button"
                    id={`process-tab-${i}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Etapa ${s.number} — ${s.title}`}
                    ref={(el) => {
                      stepRefs.current[i] = el
                    }}
                    onClick={() => select(i)}
                    className={cn(
                      'flex shrink-0 snap-center items-center gap-2 rounded-full border px-4 py-2.5 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-plum focus-visible:outline-none',
                      isActive
                        ? 'border-magenta bg-magenta text-white'
                        : 'border-lavender/20 bg-plum/40 text-lavender/60 active:border-lavender/50',
                    )}
                  >
                    <span aria-hidden="true" className="text-[11px] font-bold">
                      {s.number}
                    </span>
                    <span className="whitespace-nowrap text-[12px] font-semibold">{s.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Barra de progresso do autoplay */}
          {!reduce && (
            <div
              aria-hidden="true"
              className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-lavender/10"
            >
              <div
                key={cycle}
                className="h-full rounded-full bg-magenta"
                style={{
                  animation: `process-progress ${AUTOPLAY_MS}ms linear forwards`,
                  animationPlayState: paused || !inView ? 'paused' : 'running',
                }}
              />
            </div>
          )}

          {/* Pager mobile/tablet */}
          <div className="mt-5 flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Etapa anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-lavender/25 text-lavender/80 transition-colors hover:border-lavender/60 hover:text-white focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-plum focus-visible:outline-none"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lilac">
              Etapa {step.number} de {String(TOTAL).padStart(2, '0')}
            </p>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Próxima etapa"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-lavender/25 text-lavender/80 transition-colors hover:border-lavender/60 hover:text-white focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-plum focus-visible:outline-none"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Conteúdo da etapa */}
          <div
            role="tabpanel"
            aria-labelledby={`process-tab-${active}`}
            className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"
          >
            {/* Imagem */}
            <AnimatePresence mode="wait">
              <motion.figure
                key={step.number}
                initial={reduce ? false : { opacity: 0, scale: 1.03, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.99, y: -8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="order-2 min-w-0 overflow-hidden rounded-[24px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_-20px_rgba(0,0,0,0.45)] lg:order-1"
              >
                <img
                  src={step.image}
                  alt={step.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
                />
              </motion.figure>
            </AnimatePresence>

            {/* Número + título + descrição */}
            <div className="order-1 min-w-0 text-center lg:order-2 lg:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.number + '-content'}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p
                    aria-hidden="true"
                    className="tracking-headline text-[clamp(4.25rem,11vw,6.75rem)] font-extrabold leading-none text-lilac/25"
                  >
                    {step.number}
                  </p>
                  <h3 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <div aria-hidden="true" className="mx-auto mt-5 h-px w-12 bg-magenta/70 lg:mx-0" />
                  <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-lavender/85 sm:text-[17px] lg:mx-0">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}