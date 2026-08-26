import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { CTAButton } from '../ui/CTAButton'
import { useWizard } from '../wizard/WizardContext'
import { ArrowRight, MapPin, Calendar, BadgeCheck } from 'lucide-react'

/**
 * Seção de oportunidades publicadas. Não renderiza nada quando vazia.
 */
export function OpportunitiesSection() {
  const site = useSite()
  const { openWizard } = useWizard()
  const opportunities = site.data.opportunities ?? []

  if (opportunities.length === 0) return null

  const formatDate = (d: string | null) => {
    if (!d) return null
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return d
    }
  }

  return (
    <section
      id="oportunidades"
      aria-labelledby="opportunities-title"
      className="relative border-y border-line/60 py-20 sm:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Oportunidades"
          title={
            <span id="opportunities-title">
              Vagas e oportunidades <span className="accent-serif text-grape">disponíveis</span>.
            </span>
          }
          intro="Confira as oportunidades abertas para profissionais que desejam fazer parte da Agência Tia Sam."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {opportunities.map((o, i) => (
            <Reveal key={o.id ?? o.title} delay={0.06 * (i % 2)}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-extrabold tracking-tight text-ink">{o.title}</h3>
                    {o.status === 'published' ? (
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.type ? (
                      <span className="rounded-full bg-lavender/60 px-3 py-1 text-[11px] font-bold text-grape">
                        {o.type}
                      </span>
                    ) : null}
                    {o.location ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white/70 px-3 py-1 text-[11px] font-medium text-muted">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {o.location}
                      </span>
                    ) : null}
                    {o.closes_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white/70 px-3 py-1 text-[11px] font-medium text-muted">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        Até {formatDate(o.closes_at)}
                      </span>
                    ) : null}
                  </div>

                  {o.description ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{o.description}</p>
                  ) : null}

                  {o.requirements ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Requisitos</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink">{o.requirements}</p>
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <CTAButton
                      variant="outline"
                      onClick={() => openWizard('professional', { opportunity: String(o.id) })}
                      className="w-full"
                    >
                      Candidatar-se
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                    </CTAButton>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}