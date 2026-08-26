import { useCountUp } from '../../hooks/useCountUp'
import { SITE } from '../../config/site'
import { IMAGES } from '../../config/images'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

export function CounterSection() {
  const { value, ref } = useCountUp(SITE.familiesServed, 2000)

  return (
    <section id="familias" aria-labelledby="counter-title" className="relative overflow-hidden py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Número gigante */}
          <div className="min-w-0 lg:order-1">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
                <span aria-hidden="true" className="h-px w-8 bg-grape opacity-60" />
                Nossa história
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <p
                id="counter-title"
                className="tracking-headline mt-4 font-extrabold text-grape tabular-nums"
                aria-label={`Mais de ${SITE.familiesServed.toLocaleString('pt-BR')} famílias atendidas`}
              >
                <span ref={ref} className="text-[clamp(4.5rem,13vw,9rem)] leading-none">
                  +{value.toLocaleString('pt-BR')}
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <h2 className="text-balance mt-4 max-w-md text-[clamp(1.3rem,2.6vw,1.7rem)] font-bold leading-snug tracking-tight text-ink">
                famílias atendidas com cuidado e confiança.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
                Um número que só existe porque, em cada escolha, houve alguém de verdade
                cuidando de cada detalhe.
              </p>
            </Reveal>
          </div>

          {/* Fotografia editorial */}
          <Reveal delay={0.1} className="min-w-0 lg:order-2">
            <div className="relative">
              <div aria-hidden="true" className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-blush sm:-right-6 sm:-top-6" />
              <figure className="relative overflow-hidden rounded-[28px] shadow-lift">
                <img
                  src={IMAGES.hero.alt}
                  alt={IMAGES.hero.altAlt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3.1] w-full object-cover sm:aspect-[4/3.4]"
                />
              </figure>
              <div className="absolute -bottom-5 left-6 rounded-2xl border border-line bg-white/95 px-5 py-3.5 shadow-soft backdrop-blur-sm sm:left-10">
                <p className="text-[13px] font-extrabold tracking-tight text-ink">
                  {SITE.location}
                </p>
                <p className="text-[11px] font-medium text-muted">atendimento local e próximo</p>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
