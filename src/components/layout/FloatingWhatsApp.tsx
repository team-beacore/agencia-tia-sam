import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SITE, whatsappLink } from '../../config/site'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { useWizard } from '../wizard/WizardContext'

const OPTIONS = [
  { id: 'hire', label: 'Contratar' },
  { id: 'professional', label: 'Trabalhar com a Tia Sam' },
  { id: 'company', label: 'Empresa' },
] as const

/**
 * Botão flutuante de WhatsApp discreto.
 * Abre um mini-menu e direciona para o fluxo certo.
 */
export function FloatingWhatsApp() {
  const [open, setOpen] = useState(false)
  const { openWizard } = useWizard()
  const reduce = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (flow: (typeof OPTIONS)[number]['id']) => {
    setOpen(false)
    openWizard(flow)
  }

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-[max(1.5rem,env(safe-area-inset-right))]">
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            role="dialog"
            aria-label="Como podemos ajudar?"
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[4.25rem] right-0 w-[calc(100vw-2.5rem)] max-w-xs overflow-hidden rounded-[22px] border border-line bg-white shadow-lift"
          >
            <div className="flex items-center justify-between bg-grape px-5 py-4">
              <div>
                <p className="text-[13px] font-bold text-white">Como podemos ajudar?</p>
                <p className="mt-0.5 text-[11px] text-lilac">Atendimento humano pelo WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu do WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full text-lilac transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-2.5">
              {OPTIONS.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => choose(opt.id)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-colors duration-200',
                    i === 0 ? 'mt-0' : 'mt-1',
                    'hover:bg-lavender/50',
                  )}
                >
                  <span className="text-[14px] font-bold text-ink transition-colors group-hover:text-grape">
                    {opt.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:translate-y-[-2px] group-hover:text-grape" aria-hidden="true" />
                </button>
              ))}
            </div>

            <a
              href={whatsappLink('Olá, Agência Tia Sam! 💜 Gostaria de conversar.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-t border-line/70 px-5 py-3.5 text-[12px] font-semibold text-muted transition-colors hover:text-grape"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              ou fale direto no WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão principal */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar menu do WhatsApp' : 'Abrir menu do WhatsApp'}
        aria-expanded={open}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-grape text-white shadow-lift transition-colors duration-300 hover:bg-plum"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-grape opacity-50 animate-pulse-soft" />
        {open ? <X className="relative h-6 w-6" aria-hidden="true" /> : <WhatsAppIcon className="relative h-6 w-6" />}
      </motion.button>

      <p className="sr-only">{SITE.whatsappDisplay}</p>
    </div>
  )
}