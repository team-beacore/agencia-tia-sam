import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSite } from '../../data/SiteContext'
import { SectionHeading } from '../ui/SectionHeading'
import { Container } from '../ui/Container'
import { useWizard } from '../wizard/WizardContext'

export function ServiceExplorer() {
  const [active, setActive] = useState(0)
  const { openWizard } = useWizard()
  const site = useSite()
  const reduce = useReducedMotion()
  const SERVICES = site.services
  if (SERVICES.length === 0) return null
  const service = SERVICES[active]

  const pad = (n: number) => String(n + 1).padStart(2, '0')

  return (
    <section id="servicos" aria-labelledby="services-title" className="relative py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Nossos serviços"
          title={
            <span id="services-title">
              Profissionais para cada{' '}
              <span className="accent-serif text-grape">momento da vida</span>.
            </span>
          }
          intro="Cada serviço é pensado para oferecer o cuidado certo na medida certa — para a sua casa, para a sua família, para você."
        />

        {/* Desktop layout */}
        <div className="mt-14 hidden gap-16 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Lista vertical */}
          <ul role="tablist" aria-label="Lista de serviços" className="space-y-1.5">
            {SERVICES.map((s, i) => (
              <li key={s.slug}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => setActive(i)}
                  className={cn(
                    'group flex w-full items-center gap-5 rounded-2xl px-6 py-5 text-left transition-all duration-400',
                    active === i
                      ? 'bg-lavender/60'
                      : 'hover:bg-lavender/30',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-[13px] font-bold transition-colors duration-300',
                      active === i ? 'text-grape' : 'text-muted/50',
                    )}
                  >
                    {pad(i)}
                  </span>
                  <span className="flex-1">
                    <span
                      className={cn(
                        'block text-[17px] font-bold transition-colors duration-300',
                        active === i ? 'text-grape' : 'text-ink',
                      )}
                    >
                      {s.name}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-sm transition-colors duration-300',
                        active === i ? 'text-muted' : 'text-muted/60',
                      )}
                    >
                      {s.tagline}
                    </span>
                  </span>
                  {/* Indicador de seleção */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-all duration-400',
                      active === i ? 'bg-magenta scale-125' : 'bg-line scale-100',
                    )}
                  />
                </button>
              </li>
            ))}
            {/* Contador de progresso */}
            <li className="mt-3 flex items-center gap-3 pl-6">
              <span className="text-[12px] font-bold text-grape">
                {String(active + 1).padStart(2, '0')}
              </span>
              <span className="text-[12px] font-medium text-muted/60">
                de {String(SERVICES.length).padStart(2, '0')}
              </span>
              <div aria-hidden="true" className="h-1 flex-1 rounded-full bg-lavender">
                <div
                  className="h-full rounded-full bg-grape transition-all duration-500 ease-soft"
                  style={{ width: `${((active + 1) / SERVICES.length) * 100}%` }}
                />
              </div>
            </li>
          </ul>

          {/* Conteúdo dinâmico */}
          <div className="relative min-h-[460px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={service.slug}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Imagem */}
                <figure className="overflow-hidden rounded-[26px] shadow-soft">
                  <img
                    src={service.image}
                    alt={service.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3.2] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </figure>

                <div className="mt-6">
                  <h3 className="tracking-headline text-[clamp(1.35rem,2.5vw,1.7rem)] font-extrabold text-ink">
                    {service.name}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {service.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {service.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm font-medium text-ink">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-magenta" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => openWizard('hire', { service: service.slug })}
                    className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-grape px-7 py-3.5 text-[14px] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-plum"
                  >
                    {service.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile accordion */}
        <div className="mt-14 space-y-3 lg:hidden">
          {SERVICES.map((s, i) => {
            const open = active === i
            return (
              <div
                key={s.slug}
                className={cn(
                  'overflow-hidden rounded-2xl border transition-all duration-400',
                  open ? 'border-grape/30 bg-white shadow-soft' : 'border-line bg-white/70',
                )}
              >
                <button
                  type="button"
                  onClick={() => setActive(open ? -1 : i)}
                  id={`service-btn-${s.slug}`}
                  aria-expanded={open}
                  aria-controls={`service-panel-${s.slug}`}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-[11px] font-bold',
                      open ? 'text-grape' : 'text-muted/50',
                    )}
                  >
                    {pad(i)}
                  </span>
                  <span className="flex-1">
                    <span
                      className={cn(
                        'block text-[15px] font-bold',
                        open ? 'text-grape' : 'text-ink',
                      )}
                    >
                      {s.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{s.tagline}</span>
                  </span>
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                      open
                        ? 'border-grape/30 bg-lavender/60 text-grape'
                        : 'border-line text-muted/50',
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="content"
                      id={`service-panel-${s.slug}`}
                      role="region"
                      aria-labelledby={`service-btn-${s.slug}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6">
                        <figure className="overflow-hidden rounded-[18px]">
                          <img
                            src={s.image}
                            alt={s.alt}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[16/10] w-full object-cover"
                          />
                        </figure>
                        <p className="mt-4 text-sm leading-relaxed text-muted">
                          {s.description}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {s.benefits.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-xs font-medium text-ink">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-magenta" aria-hidden="true" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() => openWizard('hire', { service: s.slug })}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-grape px-6 py-3.5 text-[13px] font-semibold text-white shadow-soft transition-colors hover:bg-plum"
                        >
                          {s.cta}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}