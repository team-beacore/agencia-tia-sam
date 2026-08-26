import { SITE } from '../../config/site'
import { IMAGES } from '../../config/images'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

export function AboutSection() {
  return (
    <section id="sobre" aria-labelledby="about-title" className="relative py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Fotografia assimétrica */}
          <Reveal className="order-2 min-w-0 lg:order-1">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -bottom-4 -left-4 h-36 w-36 rounded-full bg-lavender/60 sm:-left-6"
              />
              <figure className="relative overflow-hidden rounded-[28px] shadow-lift">
                <img
                  src={IMAGES.about.main}
                  alt={IMAGES.about.mainAlt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3.4] w-full object-cover"
                />
              </figure>
            </div>
          </Reveal>

          {/* Texto */}
          <div className="order-1 min-w-0 lg:order-2">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
                <span aria-hidden="true" className="h-px w-8 bg-grape opacity-60" />
                Sobre a agência
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                id="about-title"
                className="tracking-headline text-balance mt-5 text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold leading-[1.08] text-ink"
              >
                Uma agência que acolhe como alguém próximo{' '}
                <span className="accent-serif text-grape">e trabalha com rigor profissional</span>.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 text-base leading-relaxed text-muted">
                A Agência Tia Sam nasceu em Manaus com uma missão clara: conectar famílias a
                profissionais de confiança. Não somos uma plataforma automática — somos um time
                de pessoas que acompanha cada escolha com atenção.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Acreditamos que cuidado de verdade começa com uma relação de confiança. Por isso,
                cada profissional que indicamos passou por um processo criterioso.
              </p>
            </Reveal>

            {/* Chips de dados */}
            <Reveal delay={0.32}>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-5 py-2.5 text-[13px] font-bold text-grape">
                  +{SITE.familiesServed.toLocaleString('pt-BR')} famílias
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-5 py-2.5 text-[13px] font-bold text-grape">
                  {SITE.location}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-5 py-2.5 text-[13px] font-bold text-grape">
                  Processo criterioso
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
