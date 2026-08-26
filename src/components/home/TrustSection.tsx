import { motion, useReducedMotion } from 'motion/react'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

const PILLARS = [
  {
    word: 'Cuidado',
    description:
      'Cada escolha começa com atenção aos detalhes que realmente importam para a sua família.',
    draw: (
      <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12" aria-hidden="true">
        <motion.path
          d="M32 52 C 16 42, 10 30, 16 21 C 21 14, 28 14, 32 20 C 36 14, 43 14, 48 21 C 54 30, 48 42, 32 52 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    ),
  },
  {
    word: 'Confiança',
    description:
      'Processo criterioso e comunicação transparente do início ao fim. Sem surpresas, sem atalhos.',
    draw: (
      <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12" aria-hidden="true">
        <motion.circle
          cx="26"
          cy="32"
          r="16"
          stroke="currentColor"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx="38"
          cy="32"
          r="16"
          stroke="currentColor"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    ),
  },
  {
    word: 'Responsabilidade',
    description:
      'Assumimos cada indicação como se fosse para a nossa própria casa. É assim que trabalhamos.',
    draw: (
      <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12" aria-hidden="true">
        <motion.path
          d="M10 34 L 32 16 L 54 34"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M18 28 V 48 H 46 V 28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M28 48 V 38 H 36 V 48"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    ),
  },
] as const

export function TrustSection() {
  const reduce = useReducedMotion()

  return (
    <section
      aria-labelledby="trust-title"
      className="relative border-y border-line/60 bg-paper/60 py-20 sm:py-28"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          {/* Grande afirmação */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
                <span aria-hidden="true" className="h-px w-8 bg-grape opacity-60" />
                Por que confiar
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                id="trust-title"
                className="tracking-headline text-balance mt-5 text-[clamp(1.75rem,4.2vw,2.75rem)] font-extrabold leading-[1.08] text-ink"
              >
                Escolher alguém para cuidar da sua família{' '}
                <span className="accent-serif text-grape">exige confiança</span>.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 text-base leading-relaxed text-muted">
                Por isso, cada profissional da Tia Sam é escolhida com um critério que começa
                muito antes do primeiro dia de trabalho.
              </p>
            </Reveal>
          </div>

          {/* Pilares */}
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {PILLARS.map((p, i) => (
              <Reveal key={p.word} delay={0.1 + i * 0.1} className="group border-t-2 border-grape/15 pt-8 transition-colors duration-500 hover:border-grape/50">
                <div className="text-grape transition-colors duration-500 group-hover:text-magenta">
                  {reduce ? null : p.draw}
                </div>
                <h3 className="mt-6 text-[clamp(1.15rem,2vw,1.45rem)] font-extrabold uppercase tracking-tight text-ink transition-colors duration-300 group-hover:text-grape">
                  {p.word}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {p.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
