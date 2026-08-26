import { ArrowRight, Check } from 'lucide-react'
import { IMAGES } from '../../config/images'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { useWizard } from '../wizard/WizardContext'

const BENEFITS = [
  'Profissionais selecionadas e verificadas',
  'Processo criterioso de triagem',
  'Atendimento personalizado por demanda',
  'Mais praticidade para o seu negócio',
]

export function CompaniesSection() {
  const { openWizard } = useWizard()

  return (
    <section id="empresas" aria-labelledby="companies-title" className="relative py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* Fotografia */}
          <Reveal className="order-2 min-w-0 lg:order-1">
            <figure className="overflow-hidden rounded-[28px] shadow-lift">
              <img
                src={IMAGES.companies.main}
                alt={IMAGES.companies.mainAlt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </figure>
          </Reveal>

          {/* Conteúdo */}
          <div className="order-1 min-w-0 lg:order-2">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
                <span aria-hidden="true" className="h-px w-8 bg-grape opacity-60" />
                Para empresas
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                id="companies-title"
                className="tracking-headline text-balance mt-5 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.06] text-ink"
              >
                Soluções profissionais{' '}
                <span className="accent-serif text-grape">para empresas</span>.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 text-base leading-relaxed text-muted">
                Sua empresa merece profissionais que entendam o ambiente corporativo. A Tia Sam
                oferece soluções sob medida para diferentes necessidades.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <ul className="mt-6 space-y-3">
                {BENEFITS.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-[15px] font-medium text-ink"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-magenta" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.32}>
              <button
                type="button"
                onClick={() => openWizard('company')}
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-grape px-7 py-3.5 text-[14px] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-plum"
              >
                Falar com a equipe
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}