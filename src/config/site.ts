/**
 * Configuração estática de navegação.
 * Os dados da marca (nome, contatos, redes) agora são administráveis
 * e carregados dinamicamente via SiteContext (com fallback em shared/seed.json).
 */
export const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Como funciona', href: '#processo' },
  { label: 'Para famílias', href: '#familias' },
  { label: 'Para profissionais', href: '#profissionais' },
  { label: 'Sobre', href: '#sobre' },
] as const

export const FOOTER_LINKS = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Como funciona', href: '#processo' },
  { label: 'Para famílias', href: '#familias' },
  { label: 'Para profissionais', href: '#profissionais' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'FAQ', href: '#faq' },
] as const

/** Número padrão (fallback) usado enquanto os dados dinâmicos não carregam. */
export const FALLBACK_WHATSAPP = '5592984146066'

/** Gera link do WhatsApp com mensagem pré-preenchida. */
export function whatsappLink(message: string, number: string = FALLBACK_WHATSAPP): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
