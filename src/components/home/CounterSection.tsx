import { useCountUp } from '../../hooks/useCountUp'
import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

export function CounterSection() {
  const site = useSite()
  const { value, ref } = useCountUp(site.familiesServed, 2000)
  const { value: mobileValue, ref: mobileRef } = useCountUp(site.familiesServed, 2000)
  const heroAlt = site.data.settings?.images?.heroAlt || '/images/hero/hero-alt.jpg'

  return (
    <section
      id="familias"
      aria-label={`Mais de ${site.familiesServed.toLocaleString('pt-BR')} famílias atendidas com cuidado e confiança`}
      className="relative overflow-hidden py-20 sm:py-28"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Número gigante (desktop) */}
          <div className="min-w-0 lg:order-1">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
                <span aria-hidden="true" className="h-px w-8 bg-grape opacity-60" />
                Nossa história
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="tracking-headline mt-4 font-extrabold text-grape tabular-nums max-lg:hidden">
                <span ref={ref} className="text-[clamp(4.5rem,13vw,9rem)] leading-none">
                  +{value.toLocaleString('pt-BR')}
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <h2 className="text-balance mt-4 max-w-md text-[clamp(1.3rem,2.6vw,1.7rem)] font-bold leading-snug tracking-tight text-ink max-lg:hidden">
                famílias atendidas com cuidado e confiança.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted max-lg:hidden">
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
                  src={heroAlt}
                  alt="Mãe e criança em um abraço carinhoso"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3.1] w-full object-cover sm:aspect-[4/3.4]"
                />
                {/* Overlay mobile: número + título sobrepostos à imagem */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-t from-night/70 via-night/35 to-night/25 p-6 text-center lg:hidden">
                  <p className="tracking-headline font-extrabold text-white tabular-nums leading-none">
                    <span ref={mobileRef} className="text-[clamp(3.5rem,11vw,4.5rem)] font-extrabold">
                      +{mobileValue.toLocaleString('pt-BR')}
                    </span>
                  </p>
                  <p className="text-balance mt-2 max-w-[15rem] text-[clamp(1.1rem,4vw,1.35rem)] font-bold leading-snug text-white">
                    famílias atendidas com cuidado e confiança.
                  </p>
                </div>
              </figure>
              <div className="absolute -bottom-5 left-6 rounded-2xl border border-line bg-white/95 px-5 py-3.5 shadow-soft backdrop-blur-sm sm:left-10">
                <p className="text-[13px] font-extrabold tracking-tight text-ink">
                  {site.siteLocation}
                </p>
                <p className="text-[11px] font-medium text-muted">atendimento local e próximo</p>
              </div>
            </div>

            {/* Texto explicativo (mobile) */}
            <Reveal delay={0.12}>
              <p className="mt-8 max-w-md text-base leading-relaxed text-muted lg:hidden">
                Um número que só existe porque, em cada escolha, houve alguém de verdade
                cuidando de cada detalhe.
              </p>
            </Reveal>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}