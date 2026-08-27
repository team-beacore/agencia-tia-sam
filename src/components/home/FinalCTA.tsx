import { ArrowRight } from 'lucide-react'
import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { CTAButton } from '../ui/CTAButton'
import { useWizard } from '../wizard/WizardContext'

export function FinalCTA() {
  const { openWizard } = useWizard()
  const site = useSite()
  const imgs = site.data.settings?.images ?? {}

  return (
    <section
      aria-labelledby="final-cta-title"
      className="relative overflow-hidden bg-plum py-24 sm:py-32"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-grape/40 blur-[110px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-magenta/20 blur-[120px]" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-lilac">
                <span aria-hidden="true" className="h-px w-8 bg-lilac opacity-50" />
                Vamos conversar
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                id="final-cta-title"
                className="tracking-headline text-balance mt-5 text-[clamp(2.2rem,6vw,3.6rem)] font-extrabold leading-[1.02] text-white"
              >
                Cuidado que <span className="accent-serif text-lilac">acolhe</span>.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-lavender/80">
                Quando alguém precisa cuidar do que importa, a escolha merece atenção. Conte com a gente.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CTAButton onClick={() => openWizard('hire')}>
                  Preciso contratar
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                </CTAButton>
                <CTAButton variant="outlineLight" onClick={() => openWizard('professional')}>
                  Quero fazer parte
                </CTAButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <figure className="relative overflow-hidden rounded-[28px] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
              <img
                src={imgs.cta || '/images/cta/cta-main.jpg'}
                alt="Mãe segurando o bebê com ternura"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3.1] w-full object-cover"
              />
            </figure>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}