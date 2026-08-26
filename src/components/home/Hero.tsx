import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { IMAGES } from '../../config/images'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useSite } from '../../data/SiteContext'
import { CTAButton } from '../ui/CTAButton'
import { Container } from '../ui/Container'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { useWizard } from '../wizard/WizardContext'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const imageItem = {
  hidden: { opacity: 0, scale: 1.045 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero() {
  const { openWizard } = useWizard()
  const site = useSite()
  const reduce = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const heroCfg = site.data.settings?.hero ?? {}
  const imgs = site.data.settings?.images ?? {}

  // Título dinâmico com a última palavra em destaque serifado (mantém a identidade)
  const fullTitle = heroCfg.title || 'Cuidado para quem importa.'
  const titleParts = fullTitle.trim().split(/\s+/)
  const lastRaw = titleParts[titleParts.length - 1] ?? ''
  const punct = lastRaw.match(/[.!?]+$/)?.[0] ?? ''
  const lastWord = lastRaw.replace(/[.!?]+$/, '')
  const titleBefore = titleParts.slice(0, -1).join(' ')

  // Parallax sutil com o mouse (apenas desktop, respeita reduced motion)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 16 })
  const sy = useSpring(my, { stiffness: 50, damping: 16 })
  const imgX = useTransform(sx, (v) => v * 12)
  const imgY = useTransform(sy, (v) => v * 9)
  const badgeX = useTransform(sx, (v) => v * 20)
  const badgeY = useTransform(sy, (v) => v * 14)

  const handleMove = (e: ReactMouseEvent<HTMLElement>) => {
    if (reduce || !isDesktop) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      id="inicio"
      aria-label="Apresentação da Agência Tia Sam"
      onMouseMove={handleMove}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28 lg:pt-44"
      style={{
        background:
          'radial-gradient(ellipse 130% 100% at 50% 30%, #FCFAFF 0%, #FCFAFF 28%, #F7F1FB 62%, #F4ECFA 100%)',
      }}
    >
      {/* Luz ambiente lilás — presença atmosférica suave, sem dominar */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10%] top-[6%] h-[32rem] w-[32rem] rounded-full bg-[#F4ECFA] opacity-90 blur-[140px]" />
        <div className="absolute bottom-[-7rem] left-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[#F7F1FB] opacity-70 blur-[130px]" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12">
          {/* Coluna de texto */}
          <motion.div
            variants={container}
            initial={reduce ? false : 'hidden'}
            animate="show"
          >
            <motion.p
              variants={item}
              className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-grape md:justify-start"
            >
              <span aria-hidden="true" className="hidden h-px w-9 bg-grape opacity-60 md:block" />
              {heroCfg.eyebrow || 'Agência Tia Sam · Manaus'}
            </motion.p>

            <motion.h1
              variants={item}
              className="tracking-headline mx-auto mt-7 max-w-[22rem] text-balance text-center text-[clamp(2.6rem,7.2vw,4.9rem)] font-extrabold leading-[1.02] text-ink md:mx-0 md:max-w-none md:text-left"
            >
              {titleBefore ? <>{titleBefore}{' '}</> : null}
              <span className="accent-serif relative text-grape">
                {lastWord}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 14"
                  className="absolute -bottom-2 left-0 w-full text-magenta/70"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 10 C 60 3, 160 3, 217 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {punct}
            </motion.h1>

            <motion.p
              variants={item}
              className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-muted sm:text-[19px] md:mx-0 md:text-left"
            >
              {heroCfg.subtitle ||
                'Conectamos famílias e profissionais com cuidado, confiança e um processo de seleção criterioso.'}
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTAButton onClick={() => openWizard('hire')} className="sm:w-auto">
                Preciso de uma profissional
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </CTAButton>
              <CTAButton variant="outline" onClick={() => openWizard('professional')} className="sm:w-auto">
                Quero fazer parte
              </CTAButton>
            </motion.div>

            <motion.p
              variants={item}
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted md:inline-flex md:justify-start"
            >
              <WhatsAppIcon className="h-4 w-4 text-grape" />
              {heroCfg.whatsappHint || 'Atendimento humano pelo WhatsApp'}
            </motion.p>
          </motion.div>

          {/* Coluna de fotografia (oculta no mobile < 768px) */}
          <motion.div variants={container} initial={reduce ? false : 'hidden'} animate="show" className="relative max-md:hidden">
            <motion.div variants={imageItem} className="relative">
              {/* Moldura decorativa */}
              <div
                aria-hidden="true"
                className="absolute -inset-4 -z-10 rounded-[38px] border border-grape/10 bg-lavender/40 sm:-inset-6"
              />
              <motion.figure
                style={reduce ? undefined : { x: imgX, y: imgY }}
                className="overflow-hidden rounded-[28px] shadow-lift sm:rounded-[34px]"
              >
                <img
                  src={imgs.heroMain || IMAGES.hero.main}
                  alt={IMAGES.hero.mainAlt}
                  className="aspect-[4/4.6] w-full object-cover sm:aspect-[4/4.2] lg:aspect-[4/4.6]"
                  fetchPriority="high"
                  decoding="async"
                />
              </motion.figure>

              {/* Badges flutuantes */}
              <motion.div
                variants={item}
                style={reduce ? undefined : { x: badgeX, y: badgeY }}
                className="absolute -left-3 top-6 sm:-left-8"
              >
                <div className="animate-float rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur-sm">
                  <p className="text-[13px] font-extrabold tracking-tight text-grape">
                    +{site.familiesServed.toLocaleString('pt-BR')} famílias
                  </p>
                  <p className="text-[11px] font-medium text-muted">atendidas com cuidado</p>
                </div>
              </motion.div>

              <motion.div
                variants={item}
                className="absolute -right-2 top-[38%] sm:-right-5"
              >
                <div className="animate-float-slow rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur-sm">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
                    <Check className="h-3.5 w-3.5 text-magenta" aria-hidden="true" />
                    Seleção criteriosa
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={item}
                className="absolute -bottom-4 left-8 sm:left-14"
              >
                <div className="animate-float rounded-2xl border border-line bg-white/95 px-4 py-2.5 shadow-soft backdrop-blur-sm [animation-delay:2s]">
                  <p className="text-[12px] font-bold text-ink">
                    Manaus <span className="font-medium text-muted">· AM</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Coluna de fotografia — mobile (< 768px): composição própria, encurtada */}
          <motion.div
            variants={container}
            initial={reduce ? false : 'hidden'}
            animate="show"
            className="relative mx-auto mt-12 w-full max-w-sm md:hidden"
          >
            <motion.div variants={imageItem} className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 -z-10 rounded-[30px] border border-grape/10 bg-lavender/40"
              />
              <motion.figure className="overflow-hidden rounded-[24px] shadow-lift">
                <img
                  src={imgs.heroMain || IMAGES.hero.main}
                  alt={IMAGES.hero.mainAlt}
                  className="aspect-[4/3.1] w-full object-cover"
                  fetchPriority="high"
                  decoding="async"
                />
              </motion.figure>
              <motion.div variants={item} className="absolute -bottom-4 left-4">
                <div className="animate-float rounded-2xl border border-line bg-white/95 px-4 py-2.5 shadow-soft backdrop-blur-sm">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
                    <Check className="h-3.5 w-3.5 text-magenta" aria-hidden="true" />
                    Seleção criteriosa
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
