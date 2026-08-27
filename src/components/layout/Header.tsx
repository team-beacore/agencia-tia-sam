import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { NAV_LINKS, whatsappLink } from '../../config/site'
import { useScrolled } from '../../hooks/useScrolled'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useSite } from '../../data/SiteContext'
import { Logo } from '../ui/Logo'
import { Container } from '../ui/Container'
import { InstagramIcon, WhatsAppIcon } from '../ui/BrandIcons'
import { useWizard } from '../wizard/WizardContext'

export function Header() {
  const scrolled = useScrolled(24)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [menuOpen, setMenuOpen] = useState(false)
  const { openWizard } = useWizard()
  const site = useSite()
  const reduce = useReducedMotion()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Trava o scroll quando o menu mobile está aberto e move o foco para o fechar
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      closeBtnRef.current?.focus()
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'border-b border-line/70 bg-cream/85 shadow-[0_8px_30px_-18px_rgba(60,27,94,0.25)] backdrop-blur-md'
            : 'bg-transparent',
        )}
      >
        {/* Faixa utilitária fina (desktop) */}
        <div
          className={cn(
            'hidden overflow-hidden transition-all duration-500 lg:block',
            scrolled ? 'max-h-0' : 'max-h-10',
          )}
        >
          <div className="border-b border-grape/10 bg-lavender/30">
            <Container className="flex h-9 items-center justify-between text-xs text-muted">
              <p className="font-medium tracking-wide">
                {site.siteLocation} · {site.data.settings?.site?.hours || 'Atendimento humano pelo WhatsApp'}
              </p>
              <div className="flex items-center gap-5">
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-grape transition-colors hover:text-plum"
                >
                  <InstagramIcon className="h-3.5 w-3.5" />
                  {site.instagramHandle}
                </a>
                <a
                  href={whatsappLink('Olá, Agência Tia Sam! 💜 Gostaria de conversar.', site.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-grape transition-colors hover:text-plum"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  {site.whatsappDisplay}
                </a>
              </div>
            </Container>
          </div>
        </div>

        {/* Barra principal */}
        <div
          className={cn(
            'transition-all duration-500',
            scrolled ? 'py-2.5' : 'py-4',
          )}
        >
          <Container className="flex items-center justify-between gap-4">
            <Logo compact={scrolled} dark={!scrolled && !isDesktop} />

            <nav aria-label="Navegação principal" className="hidden items-center gap-7 xl:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[14px] font-medium text-ink/80 transition-colors hover:text-grape"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openWizard('hire')}
                className="group hidden items-center gap-2 rounded-full bg-grape px-6 py-2.5 text-[14px] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-plum sm:inline-flex"
              >
                Quero contratar
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white/70 text-ink transition-colors hover:border-grape/40 hover:text-grape xl:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </Container>
        </div>
      </header>

      {/* Menu mobile fullscreen */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed inset-0 z-[70] flex flex-col bg-cream xl:hidden"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <Logo onClick={() => setMenuOpen(false)} />
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white/70 text-ink transition-colors hover:border-grape/40 hover:text-grape"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <nav
                aria-label="Menu mobile"
                className="flex min-h-full flex-col justify-center gap-1"
              >
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-4 border-b border-line/80 py-4"
                    initial={reduce ? false : { opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="text-xs font-semibold text-muted/60">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[26px] font-bold tracking-tight text-ink transition-colors group-hover:text-grape">
                      {link.label}
                    </span>
                  </motion.a>
                ))}
              </nav>

              <motion.div
                className="pt-2"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openWizard('hire')
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-full bg-grape px-7 py-4 text-base font-semibold text-white shadow-soft transition-colors hover:bg-plum"
              >
                Quero contratar
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm font-medium text-muted">
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-grape"
                >
                  <InstagramIcon className="h-4 w-4" />
                  Instagram
                </a>
                <a
                  href={whatsappLink('Olá, Agência Tia Sam! 💜 Gostaria de conversar.', site.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-grape"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
              <p className="mt-4 text-center text-xs text-muted">{site.siteLocation}</p>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
