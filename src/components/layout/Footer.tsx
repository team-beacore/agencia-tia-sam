import { FOOTER_LINKS, whatsappLink } from '../../config/site'
import { useSite } from '../../data/SiteContext'
import { Container } from '../ui/Container'
import { Logo } from '../ui/Logo'
import { InstagramIcon, WhatsAppIcon } from '../ui/BrandIcons'

export function Footer() {
  const year = new Date().getFullYear()
  const site = useSite()
  const settings = site.data.settings ?? {}
  const siteSettings = settings.site ?? {}

  return (
    <footer className="border-t border-line/60 bg-paper/70">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
              Conectamos famílias e profissionais com cuidado, confiança e um processo de
              seleção criterioso. {siteSettings.claim || site.data.settings?.site?.claim}
            </p>
            <p className="mt-5 text-sm font-medium text-grape">{site.siteLocation}</p>
          </div>

          {/* Links */}
          <nav aria-label="Links do rodapé">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              Navegação
            </p>
            <ul className="mt-5 space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[15px] font-medium text-ink/80 transition-colors hover:text-grape"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contato */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              Contato
            </p>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={whatsappLink('Olá, Agência Tia Sam! 💜 Gostaria de conversar.', site.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-[15px] font-medium text-ink/80 transition-colors hover:text-grape"
                >
                  <WhatsAppIcon className="h-4 w-4 text-grape" />
                  {site.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-[15px] font-medium text-ink/80 transition-colors hover:text-grape"
                >
                  <InstagramIcon className="h-4 w-4 text-grape" />
                  {site.instagramHandle}
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              Atendimento humano pelo WhatsApp.
              <br />
              Resposta de uma pessoa de verdade.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-line/70 pt-7 sm:flex-row">
          <p className="text-[13px] font-medium text-muted">
            © {year} {site.siteName}. Todos os direitos reservados.
          </p>
          <p className="accent-serif text-[13px] italic text-muted">
            {siteSettings.claim || 'Cuidado que acolhe. Confiança que fica.'}
          </p>
        </div>
      </Container>
    </footer>
  )
}
