import { Target, Eye, Heart } from 'lucide-react'
import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { Eyebrow } from '../ui/Eyebrow'
import { cn } from '../../lib/cn'
import { useCountUp } from '../../hooks/useCountUp'

const DEFAULT_MISSION =
  'Conectar famílias aos melhores profissionais, oferecendo segurança, confiança e tranquilidade no dia a dia.'
const DEFAULT_VISION =
  'Ser referência em intermediação de profissionais do lar e cuidado, transformando vidas e fortalecendo laços.'
const DEFAULT_VALUES = ['Ética', 'Respeito', 'Empatia', 'Compromisso', 'Excelência no atendimento']

function FounderPhoto({ name, image, age, className }: { name: string; image: string; age: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div aria-hidden="true" className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-blush sm:-right-6 sm:-top-6" />
      <div aria-hidden="true" className="absolute -bottom-5 -left-5 h-24 w-24 rounded-full bg-lavender/70 sm:-left-6" />
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-paper shadow-lift">
        {image ? (
          <img
            src={image}
            alt={`Foto de ${name}`}
            loading="lazy"
            decoding="async"
            className="aspect-[4/4.4] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/4.4] w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-lavender/70 via-paper to-blush/70 p-8 text-center">
            <span aria-hidden="true" className="accent-serif text-[clamp(4.5rem,12vw,6.5rem)] leading-none text-grape/80">
              SS
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">{name}</span>
          </div>
        )}
      </div>
      <div className="absolute -bottom-5 left-6 rounded-2xl border border-line bg-white/95 px-5 py-3.5 shadow-soft backdrop-blur-sm sm:left-10">
        <p className="text-[13px] font-extrabold tracking-tight text-ink">{age}</p>
        <p className="text-[11px] font-medium text-muted">fundadora</p>
      </div>
    </div>
  )
}

export function AboutSection() {
  const site = useSite()
  const settings = site.data.settings ?? {}
  const about = settings.about ?? {}
  const founder = about.founder ?? {}
  const imgs = settings.images ?? {}
  const values = Array.isArray(about.values) && about.values.length ? about.values : DEFAULT_VALUES

  const { value: families, ref: familiesRef } = useCountUp(site.familiesServed, 2000)

  const founderImg = imgs.founder || founder.image || ''
  const founderName = founder.name || 'Samara Santos'
  const aboutImg = imgs.about || '/images/about/about-main.jpg'

  return (
    <section
      id="sobre"
      aria-labelledby="about-title"
      className="relative overflow-hidden py-20 sm:py-28"
    >
      <Container>
        {/* ---------- BLOCO 1 — A AGÊNCIA ---------- */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Conteúdo */}
          <div className="min-w-0">
            <Reveal>
              <Eyebrow>{about.eyebrow || 'Sobre a agência'}</Eyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                id="about-title"
                className="tracking-headline text-balance mt-5 text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold leading-[1.08] text-ink"
              >
                {about.title ||
                  'Uma agência que acolhe como alguém próximo e trabalha com rigor profissional.'}
              </h2>
            </Reveal>

            {/* Fotografia da agência (mobile/tablet: logo abaixo do título) */}
            <Reveal delay={0.12} className="lg:hidden">
              <figure className="mt-6 overflow-hidden rounded-[28px] shadow-lift">
                <img
                  src={aboutImg}
                  alt="Momento afetuoso entre avó e criança"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3.4] w-full object-cover"
                />
              </figure>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-5 text-base leading-relaxed text-muted">
                {about.text1 ||
                  'A Agência Tia Sam nasceu em Manaus com uma missão clara: conectar famílias a profissionais de confiança. Não somos uma plataforma automática — somos um time de pessoas que acompanha cada escolha com atenção.'}
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-4 text-base leading-relaxed text-muted">
                {about.text2 ||
                  'Acreditamos que cuidado de verdade começa com uma relação de confiança. Por isso, cada profissional que indicamos passou por um processo criterioso.'}
              </p>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-5 py-2.5 text-[13px] font-bold text-grape">
                  {site.siteLocation}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-5 py-2.5 text-[13px] font-bold text-grape">
                  Processo criterioso
                </span>
              </div>
            </Reveal>
          </div>

          {/* Fotografia da agência (desktop: coluna separada) */}
          <Reveal className="min-w-0 max-lg:hidden">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -bottom-4 -left-4 h-36 w-36 rounded-full bg-lavender/60 sm:-left-6"
              />
              <figure className="relative overflow-hidden rounded-[28px] shadow-lift">
                <img
                  src={aboutImg}
                  alt="Momento afetuoso entre avó e criança"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3.4] w-full object-cover"
                />
              </figure>
            </div>
          </Reveal>
        </div>

        {/* ---------- NÚMEROS DA HISTÓRIA ---------- */}
        <Reveal delay={0.1}>
          <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-line bg-line shadow-soft sm:mt-20 lg:grid-cols-4">
            <div className="bg-white p-6 sm:p-7">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Fundada</dt>
              <dd className="tracking-headline mt-2.5 text-lg font-extrabold leading-tight text-grape sm:text-xl">
                {about.stats?.founded || 'Dezembro de 2025'}
              </dd>
            </div>
            <div className="bg-white p-6 sm:p-7">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Famílias atendidas</dt>
              <dd className="tracking-headline mt-2.5 text-lg font-extrabold leading-tight text-grape tabular-nums sm:text-xl">
                <span ref={familiesRef}>+{families.toLocaleString('pt-BR')}</span>
              </dd>
            </div>
            <div className="bg-white p-6 sm:p-7">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Experiência da fundadora</dt>
              <dd className="tracking-headline mt-2.5 text-lg font-extrabold leading-tight text-grape sm:text-xl">
                {about.stats?.founderExperience || '4 anos'}
              </dd>
            </div>
            <div className="bg-white p-6 sm:p-7">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Atuação da agência</dt>
              <dd className="tracking-headline mt-2.5 text-lg font-extrabold leading-tight text-grape sm:text-xl">
                {about.stats?.monthsActive || '9 meses'}
              </dd>
            </div>
          </dl>
        </Reveal>

        {/* ---------- BLOCO 2 — QUEM ESTÁ POR TRÁS ---------- */}
        <div className="mt-20 grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 sm:mt-28">
          {/* Fotografia da fundadora (desktop: coluna separada) */}
          <Reveal className="min-w-0 lg:order-1 max-lg:hidden">
            <FounderPhoto
              name={founderName}
              image={founderImg}
              age={founder.age || '28 anos'}
              className="mx-auto max-w-sm sm:max-w-md lg:max-w-none"
            />
          </Reveal>

          {/* Conteúdo da fundadora */}
          <div className="min-w-0 lg:order-2">
            <Reveal>
              <Eyebrow>{founder.eyebrow || 'Quem está por trás'}</Eyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h3
                id="founder-name"
                className="tracking-headline text-balance mt-5 text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold leading-[1.08] text-ink"
              >
                {founderName}
              </h3>
            </Reveal>

            {/* Fotografia da fundadora (mobile/tablet: logo abaixo do nome) */}
            <Reveal delay={0.12} className="lg:hidden">
              <FounderPhoto
                name={founderName}
                image={founderImg}
                age={founder.age || '28 anos'}
                className="mx-auto mt-6 max-w-sm sm:max-w-md"
              />
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.18em] text-grape">
                {founder.role || 'CEO da Agência Tia Sam'}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                {founder.bio ||
                  'Samara Santos tem 28 anos e é graduanda em Recursos Humanos, com 4 anos de experiência como babysitter, cuidadora infantil e assistência pós-parto. Em dezembro de 2025, ela fundou a Agência Tia Sam.'}
              </p>
            </Reveal>
            <Reveal delay={0.28}>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-4 py-2 text-[12px] font-bold text-grape">
                  {founder.formation || 'Graduanda em Recursos Humanos'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-grape/20 bg-lavender/50 px-4 py-2 text-[12px] font-bold text-grape">
                  {founder.experience || '4 anos de experiência'}
                </span>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ---------- MISSÃO, VISÃO E VALORES ---------- */}
        <div className="mt-20 sm:mt-28">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow withLine={false} className="justify-center">
                O que nos guia
              </Eyebrow>
              <h3 className="tracking-headline text-balance mt-4 text-[clamp(1.5rem,3.4vw,2.1rem)] font-extrabold text-ink">
                Missão, visão e valores
              </h3>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Reveal delay={0.05}>
              <div className="flex h-full flex-col rounded-[24px] border border-line bg-white p-7 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lavender text-grape">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">Missão</p>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{about.mission || DEFAULT_MISSION}</p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="flex h-full flex-col rounded-[24px] border border-line bg-white p-7 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lavender text-grape">
                  <Eye className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">Visão</p>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{about.vision || DEFAULT_VISION}</p>
              </div>
            </Reveal>
            <Reveal delay={0.19}>
              <div className="flex h-full flex-col rounded-[24px] border border-line bg-white p-7 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lavender text-grape">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">Valores</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {values.map((v: string) => (
                    <li
                      key={v}
                      className="rounded-full border border-grape/20 bg-lavender/50 px-3.5 py-1.5 text-[12px] font-bold text-grape"
                    >
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
