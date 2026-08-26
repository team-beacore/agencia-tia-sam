import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { MapPin, Clock, Briefcase } from 'lucide-react'

/**
 * Vitrine de profissionais publicadas no site (apenas as que o painel
 * marcou como "Exibir no site" + ativas). Não renderiza nada quando vazio.
 */
export function ProfessionalsGrid() {
  const site = useSite()
  const professionals = site.data.professionals ?? []

  if (professionals.length === 0) return null

  return (
    <section
      id="profissionais-disponiveis"
      aria-labelledby="professionals-grid-title"
      className="relative border-t border-line/60 bg-paper/40 py-20 sm:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Profissionais disponíveis"
          title={
            <span id="professionals-grid-title">
              Conheça quem já faz parte <span className="accent-serif text-grape">da Tia Sam</span>.
            </span>
          }
          intro="Profissionais selecionadas e aprovadas pelo nosso processo criterioso, prontas para novos lares."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((p, i) => (
            <Reveal key={p.id ?? p.name} delay={0.06 * (i % 3)}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative aspect-[4/3] overflow-hidden bg-lavender/40">
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={`Foto de ${p.name}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-serif text-6xl italic text-grape/30">
                        {p.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {p.role ? (
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-grape shadow-soft backdrop-blur-sm">
                      {p.role}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-extrabold tracking-tight text-ink">{p.name}</h3>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.services ?? []).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-grape/15 bg-lavender/50 px-2.5 py-0.5 text-[11px] font-semibold text-grape"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {p.bio ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{p.bio}</p>
                  ) : null}

                  <ul className="mt-4 space-y-1.5 border-t border-line/60 pt-4 text-[13px] text-muted">
                    {p.location ? (
                      <li className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-grape" aria-hidden="true" />
                        {p.location}
                      </li>
                    ) : null}
                    {p.availability ? (
                      <li className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-grape" aria-hidden="true" />
                        {p.availability}
                      </li>
                    ) : null}
                    {p.experience ? (
                      <li className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-grape" aria-hidden="true" />
                        {p.experience}
                      </li>
                    ) : null}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
