import { ArrowRight } from 'lucide-react'
import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { AccentTitle } from '../ui/AccentTitle'
import { useWizard } from '../wizard/WizardContext'

const DEFAULT_STEPS = ['Cadastro', 'Análise', 'Entrevista', 'Aprovação', 'Oportunidades']

export function ProfessionalsSection() {
  const { openWizard } = useWizard()
  const site = useSite()
  const settings = site.data.settings ?? {}
  const prof = settings.professionals ?? {}
  const imgs = settings.images ?? {}
  const steps: string[] = prof.steps?.length ? prof.steps : DEFAULT_STEPS

  return (
    <section id="profissionais" aria-labelledby="professionals-title" className="relative border-y border-line/60 bg-paper/60 py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Conteúdo */}
          <div className="min-w-0 lg:order-1">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
                <span aria-hidden="true" className="h-px w-8 bg-grape opacity-60" />
                {prof.eyebrow || 'Para profissionais'}
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                id="professionals-title"
                className="tracking-headline text-balance mt-5 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.06] text-ink"
              >
                <AccentTitle text={prof.title || 'Faça parte das oportunidades da Tia Sam.'} />
              </h2>
            </Reveal>

            {/* Fotografia (mobile: após o título; desktop: coluna separada) */}
            <Reveal delay={0.12} className="lg:hidden">
              <figure className="overflow-hidden rounded-[28px] shadow-lift">
                <img
                  src={imgs.professionals || '/images/professionals/professional-main.jpg'}
                  alt="Profissional sorrindo com confiança"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3.2] w-full object-cover"
                />
              </figure>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-5 text-base leading-relaxed text-muted">
                {prof.text ||
                  'Se você é uma profissional que busca oportunidades com seriedade e respeito, a Tia Sam é o seu lugar. Todo o processo é transparente e acolhedor.'}
              </p>
            </Reveal>

            {/* Mini-timeline horizontal */}
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-start gap-1 sm:gap-3">
                {steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-1 sm:gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-[11px] font-bold text-grape"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="mt-1.5 text-[10px] font-medium text-muted sm:text-[11px]">
                        {step}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div aria-hidden="true" className="mb-5 h-px w-2 bg-line sm:w-6" />
                    )}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <button
                type="button"
                onClick={() => openWizard('professional')}
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-grape px-7 py-3.5 text-[14px] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-plum"
              >
                {prof.cta || 'Quero fazer parte'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </Reveal>
          </div>

          {/* Fotografia (desktop) */}
          <Reveal className="min-w-0 lg:order-2 max-lg:hidden">
            <figure className="overflow-hidden rounded-[28px] shadow-lift">
              <img
                src={imgs.professionals || '/images/professionals/professional-main.jpg'}
                alt="Profissional sorrindo com confiança"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3.2] w-full object-cover"
              />
            </figure>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}