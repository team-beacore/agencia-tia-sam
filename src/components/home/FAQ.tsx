import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const reduce = useReducedMotion()
  const site = useSite()
  const FAQS = site.faqs

  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line/60 py-20 sm:py-28">
      <Container className="max-w-4xl">
        <SectionHeading
          eyebrow="Perguntas frequentes"
          title={<span id="faq-title">Tudo o que você precisa saber.</span>}
          intro="Se a sua dúvida não estiver aqui, é só chamar a gente — respondemos com atenção."
        />

        <div className="mt-12">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={faq.question}
                className={cn(
                  'border-b border-line/80 transition-colors duration-300',
                  isOpen && 'border-grape/25',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  id={`faq-btn-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="flex items-baseline gap-4">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'text-[11px] font-bold transition-colors duration-300',
                        isOpen ? 'text-magenta' : 'text-muted/50',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'text-[16px] font-bold tracking-tight transition-colors duration-300 sm:text-[17px]',
                        isOpen ? 'text-grape' : 'text-ink group-hover:text-grape',
                      )}
                    >
                      {faq.question}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                      isOpen
                        ? 'rotate-45 border-magenta text-magenta'
                        : 'border-line text-muted group-hover:border-grape/40 group-hover:text-grape',
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-btn-${i}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pl-[3.25rem] pr-2 text-[15px] leading-relaxed text-muted">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}