/**
 * Configuração central da marca.
 * Todas as informações reais da Agência Tia Sam ficam aqui.
 * Nada de dados inventados: apenas o que foi fornecido.
 */
export const SITE = {
  name: 'Agência Tia Sam',
  tagline: 'Cuidado que conecta.',
  claim: 'Cuidado que acolhe. Confiança que fica.',
  location: 'Manaus - AM',
  city: 'Manaus',
  instagramHandle: '@agenciatiasam.manaus',
  instagramUrl: 'https://www.instagram.com/agenciatiasam.manaus',
  whatsappNumber: '5592984146066',
  whatsappDisplay: '+55 92 98414-6066',
  familiesServed: 3000,
} as const

export const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Como funciona', href: '#processo' },
  { label: 'Para famílias', href: '#familias' },
  { label: 'Para profissionais', href: '#profissionais' },
  { label: 'Empresas', href: '#empresas' },
  { label: 'Sobre', href: '#sobre' },
] as const

export const FOOTER_LINKS = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Como funciona', href: '#processo' },
  { label: 'Para famílias', href: '#familias' },
  { label: 'Para profissionais', href: '#profissionais' },
  { label: 'Empresas', href: '#empresas' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'FAQ', href: '#faq' },
] as const

/** Gera link do WhatsApp com mensagem pré-preenchida. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`
}
